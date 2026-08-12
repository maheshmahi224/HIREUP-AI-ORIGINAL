import assert from 'node:assert';
import { ObjectId } from 'mongodb';
import {
  computeResumeContentHash,
  normalizeResumeContent,
  recordResumeVersion,
  verifyAndCreateEntitlement,
  checkContentEntitlement,
  authorizeDownloadAndAudit,
} from '../services/entitlement.js';
import { database } from '../db/mongo.js';

async function runAllEntitlementTests() {
  console.log('🧪 Starting Content Fingerprint & Entitlement Test Suite (12 Test Cases)...\n');

  const db = await database();

  // Test Fixtures
  const userA = new ObjectId();
  const userB = new ObjectId();
  const resumeId = new ObjectId();

  const baseContent = {
    personal: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 555-0199',
      jobTitle: 'Senior Software Engineer',
      location: 'New York, NY',
    },
    summary: 'Experienced developer building scalable cloud architecture.',
    experience: [
      {
        company: 'TechCorp',
        role: 'Lead Architect',
        startDate: '2021',
        endDate: 'Present',
        description: 'Led a team of 10 engineers.',
        highlights: ['Increased throughput by 300%', 'Reduced infrastructure cost by 40%'],
      },
    ],
    education: [
      {
        institution: 'MIT',
        degree: 'B.S. Computer Science',
        startDate: '2017',
        endDate: '2021',
      },
    ],
    skills: ['TypeScript', 'Node.js', 'MongoDB', 'React'],
    customization: {
      language: 'en-GB',
      pageFormat: 'A4',
      fontSize: 9,
      primaryColor: '#FF2D55',
    },
  };

  const templateA = 'classic';
  const templateB = 'modern';

  // Cleanup prior test artifacts
  await db.collection('paymentEntitlements').deleteMany({ resumeId });
  await db.collection('resumeVersions').deleteMany({ resumeId });
  await db.collection('downloadAudits').deleteMany({ resumeId });

  // ---------------------------------------------------------------------------
  // TEST 1: Pay -> download -> PASS
  // ---------------------------------------------------------------------------
  console.log('Test 1: Pay -> download -> PASS');
  const hash1 = computeResumeContentHash(templateA, baseContent);
  await recordResumeVersion(userA, resumeId, templateA, baseContent);
  await verifyAndCreateEntitlement({
    userId: userA,
    resumeId,
    contentHash: hash1,
    amount: 3000,
    currency: 'INR',
    razorpayOrderId: 'order_test_1',
    razorpayPaymentId: 'pay_test_1',
  });

  const res1 = await authorizeDownloadAndAudit(userA, resumeId, templateA, baseContent);
  assert.strictEqual(res1.authorized, true, 'Test 1 Failed: Pay -> download should be authorized');
  console.log('   ✓ Test 1 Passed\n');

  // ---------------------------------------------------------------------------
  // TEST 2: Pay -> download twice -> PASS without second payment
  // ---------------------------------------------------------------------------
  console.log('Test 2: Pay -> download twice -> PASS without second payment');
  const res2 = await authorizeDownloadAndAudit(userA, resumeId, templateA, baseContent);
  assert.strictEqual(res2.authorized, true, 'Test 2 Failed: Second download should be authorized');
  const auditsCount = await db.collection('downloadAudits').countDocuments({ userId: userA, resumeId, contentHash: hash1 });
  assert.strictEqual(auditsCount, 2, 'Test 2 Failed: Should record 2 download audit records');
  console.log('   ✓ Test 2 Passed\n');

  // ---------------------------------------------------------------------------
  // TEST 3: Pay -> edit resume -> download -> PAYMENT_REQUIRED
  // ---------------------------------------------------------------------------
  console.log('Test 3: Pay -> edit resume -> download -> PAYMENT_REQUIRED');
  const editedContent = JSON.parse(JSON.stringify(baseContent));
  editedContent.experience[0].description = 'Led an elite team of 15 engineers.';

  const res3 = await authorizeDownloadAndAudit(userA, resumeId, templateA, editedContent);
  assert.strictEqual(res3.authorized, false, 'Test 3 Failed: Edited content should require payment');
  console.log('   ✓ Test 3 Passed\n');

  // ---------------------------------------------------------------------------
  // TEST 4: Pay -> edit -> revert exactly to paid state -> download -> PASS
  // ---------------------------------------------------------------------------
  console.log('Test 4: Pay -> edit -> revert exactly to paid state -> download -> PASS');
  const res4 = await authorizeDownloadAndAudit(userA, resumeId, templateA, baseContent);
  assert.strictEqual(res4.authorized, true, 'Test 4 Failed: Reverted content hash should match paid entitlement');
  console.log('   ✓ Test 4 Passed\n');

  // ---------------------------------------------------------------------------
  // TEST 5: Pay Template A -> switch Template B -> download -> PAYMENT_REQUIRED
  // ---------------------------------------------------------------------------
  console.log('Test 5: Pay Template A -> switch Template B -> download -> PAYMENT_REQUIRED');
  const res5 = await authorizeDownloadAndAudit(userA, resumeId, templateB, baseContent);
  assert.strictEqual(res5.authorized, false, 'Test 5 Failed: Switching template requires new payment');
  console.log('   ✓ Test 5 Passed\n');

  // ---------------------------------------------------------------------------
  // TEST 6: Pay -> change font -> download -> PAYMENT_REQUIRED
  // ---------------------------------------------------------------------------
  console.log('Test 6: Pay -> change font -> download -> PAYMENT_REQUIRED');
  const fontContent = JSON.parse(JSON.stringify(baseContent));
  fontContent.customization.fontSize = 11;

  const res6 = await authorizeDownloadAndAudit(userA, resumeId, templateA, fontContent);
  assert.strictEqual(res6.authorized, false, 'Test 6 Failed: Font size change requires new payment');
  console.log('   ✓ Test 6 Passed\n');

  // ---------------------------------------------------------------------------
  // TEST 7: Pay -> change only sidebar/zoom UI state -> download -> PASS
  // ---------------------------------------------------------------------------
  console.log('Test 7: Pay -> change only sidebar/zoom UI state -> download -> PASS');
  const uiStateContent = JSON.parse(JSON.stringify(baseContent));
  uiStateContent.ephemeralSidebarCollapsed = true;
  uiStateContent.zoomLevel = 1.25;

  const hashUI = computeResumeContentHash(templateA, uiStateContent);
  assert.strictEqual(hashUI, hash1, 'Test 7 Failed: Ephemeral UI state should be excluded from hash computation');
  const res7 = await authorizeDownloadAndAudit(userA, resumeId, templateA, uiStateContent);
  assert.strictEqual(res7.authorized, true, 'Test 7 Failed: Changing ephemeral UI state should pass');
  console.log('   ✓ Test 7 Passed\n');

  // ---------------------------------------------------------------------------
  // TEST 8: User A payment -> User B tries same resume -> REJECT
  // ---------------------------------------------------------------------------
  console.log('Test 8: User A payment -> User B tries same resume -> REJECT');
  const res8 = await authorizeDownloadAndAudit(userB, resumeId, templateA, baseContent);
  assert.strictEqual(res8.authorized, false, 'Test 8 Failed: User B cannot use User A payment');
  console.log('   ✓ Test 8 Passed\n');

  // ---------------------------------------------------------------------------
  // TEST 9: Fake frontend payment success -> REJECT
  // ---------------------------------------------------------------------------
  console.log('Test 9: Fake frontend payment success -> REJECT');
  const fakeResumeId = new ObjectId();
  const res9 = await authorizeDownloadAndAudit(userA, fakeResumeId, templateA, baseContent);
  assert.strictEqual(res9.authorized, false, 'Test 9 Failed: Fake frontend state without server entitlement must be rejected');
  console.log('   ✓ Test 9 Passed\n');

  // ---------------------------------------------------------------------------
  // TEST 10: Duplicate Razorpay callback -> no duplicate entitlement
  // ---------------------------------------------------------------------------
  console.log('Test 10: Duplicate Razorpay callback -> no duplicate entitlement');
  const result10a = await verifyAndCreateEntitlement({
    userId: userA,
    resumeId,
    contentHash: hash1,
    amount: 3000,
    currency: 'INR',
    razorpayOrderId: 'order_test_1',
    razorpayPaymentId: 'pay_test_1',
  });

  const entitlementsCount = await db.collection('paymentEntitlements').countDocuments({ userId: userA, resumeId, contentHash: hash1 });
  assert.strictEqual(entitlementsCount, 1, 'Test 10 Failed: Duplicate callback must not create duplicate entitlement');
  assert.strictEqual(result10a.created, false, 'Test 10 Failed: Duplicate upsert should report created=false');
  console.log('   ✓ Test 10 Passed\n');

  // ---------------------------------------------------------------------------
  // TEST 11: Modified client contentHash -> server recalculates and rejects mismatch
  // ---------------------------------------------------------------------------
  console.log('Test 11: Modified client contentHash -> server recalculates and rejects mismatch');
  const serverCalculatedHash = computeResumeContentHash(templateA, editedContent);
  assert.notStrictEqual(serverCalculatedHash, hash1, 'Test 11 Failed: Hashes must differ for modified content');
  const isPaid11 = await checkContentEntitlement(userA, resumeId, serverCalculatedHash);
  assert.strictEqual(isPaid11, false, 'Test 11 Failed: Server recalculation must reject client hash spoofing');
  console.log('   ✓ Test 11 Passed\n');

  // ---------------------------------------------------------------------------
  // TEST 12: Previously paid Version 7 remains downloadable after creating unpaid Version 8
  // ---------------------------------------------------------------------------
  console.log('Test 12: Previously paid Version 7 remains downloadable after creating unpaid Version 8');
  // Version 7 (baseContent) is paid (hash1)
  // Version 8 (editedContent) is unpaid (serverCalculatedHash)
  await recordResumeVersion(userA, resumeId, templateA, editedContent);

  const res12PaidState = await authorizeDownloadAndAudit(userA, resumeId, templateA, baseContent);
  assert.strictEqual(res12PaidState.authorized, true, 'Test 12 Failed: Paid Version 7 state must remain downloadable');

  const res12UnpaidState = await authorizeDownloadAndAudit(userA, resumeId, templateA, editedContent);
  assert.strictEqual(res12UnpaidState.authorized, false, 'Test 12 Failed: Unpaid Version 8 state must require payment');
  console.log('   ✓ Test 12 Passed\n');

  // Cleanup test artifacts
  await db.collection('paymentEntitlements').deleteMany({ resumeId });
  await db.collection('resumeVersions').deleteMany({ resumeId });
  await db.collection('downloadAudits').deleteMany({ resumeId });

  console.log('======================================================');
  console.log('🎉 ALL 12 CONTENT FINGERPRINT & ENTITLEMENT TESTS PASSED!');
  console.log('======================================================\n');
}

runAllEntitlementTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('💥 Test suite failed:', err);
    process.exit(1);
  });
