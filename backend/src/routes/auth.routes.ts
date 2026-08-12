import crypto from 'node:crypto'; import bcrypt from 'bcryptjs'; import { Router } from 'express'; import { ObjectId } from 'mongodb'; import { env } from '../config/env.js'; import { database } from '../db/mongo.js'; import { authenticate, clearSession, createSession } from '../middleware/auth.js'; import type { User } from '../types/domain.js'; import { email, loginSchema, otpRequestSchema, otpVerifySchema, registerSchema } from '../validators/schemas.js'; import { asyncRoute, fail, getValidated, ok, validate } from '../utils/http.js'; import { sendOtpEmail } from '../services/email.js';
const router=Router(); const sha=(s:string)=>crypto.createHash('sha256').update(s).digest('hex'); const code=()=>crypto.randomInt(100000,1000000).toString();
router.post('/register',validate(registerSchema),asyncRoute(async(req,res)=>{const input=getValidated<typeof registerSchema._output>(req); const db=await database(); if(await db.collection<User>('users').findOne({email:input.email})) return fail(res,409,'EMAIL_EXISTS','An account with this email already exists'); const now=new Date(); const result=await db.collection<User>('users').insertOne({name:input.name,email:input.email,passwordHash:await bcrypt.hash(input.password,12),role:'user',createdAt:now,updatedAt:now}); await db.collection('profiles').insertOne({userId:result.insertedId,personal:{name:input.name,email:input.email},sections:{education:[],experience:[],internships:[],projects:[],skills:[],certifications:[],achievements:[],awards:[],languages:[],custom:[]},createdAt:now,updatedAt:now}); await createSession(res,result.insertedId); return ok(res,{user:{id:result.insertedId,name:input.name,email:input.email,role:'user'}},201); }));
router.post('/login',validate(loginSchema),asyncRoute(async(req,res)=>{const input=getValidated<typeof loginSchema._output>(req); const user=await (await database()).collection<User>('users').findOne({email:input.email}); if(!user?.passwordHash||!await bcrypt.compare(input.password,user.passwordHash)) return fail(res,401,'INVALID_CREDENTIALS','Invalid email or password'); await createSession(res,user._id!); return ok(res,{user:{id:user._id,name:user.name,email:user.email,role:user.role}}); }));
router.get('/session',authenticate,asyncRoute(async(req,res)=>ok(res,{user:{id:req.auth!.user._id,name:req.auth!.user.name,email:req.auth!.user.email,role:req.auth!.user.role},csrfToken:req.cookies.csrf})));
router.post('/logout',authenticate,asyncRoute(async(req,res)=>{await clearSession(req,res); return res.status(204).end();}));
router.post('/otp/request',validate(otpRequestSchema),asyncRoute(async(req,res)=>{const {email:address}=getValidated<typeof otpRequestSchema._output>(req); const db=await database(); const key=sha(`${req.ip}:${address}`); const recent=await db.collection('otpSessions').countDocuments({rateKey:key,createdAt:{$gt:new Date(Date.now()-3600000)}}); if(recent>=5)return fail(res,429,'OTP_RATE_LIMIT','Try again later'); const value=code(), now=new Date(); await db.collection('otpSessions').updateMany({email:address,usedAt:{$exists:false}},{$set:{usedAt:now}}); await db.collection('otpSessions').insertOne({email:address,codeHash:await bcrypt.hash(value,12),rateKey:key,attempts:0,maxAttempts:5,createdAt:now,expiresAt:new Date(Date.now()+600000)}); await sendOtpEmail(address,value); return ok(res,{message:'If the address is eligible, a code has been sent.'},202); }));
router.post('/otp/verify',validate(otpVerifySchema),asyncRoute(async(req,res)=>{const input=getValidated<typeof otpVerifySchema._output>(req); const db=await database(); const otp=await db.collection('otpSessions').findOne({email:input.email,usedAt:{$exists:false},expiresAt:{$gt:new Date()}},{sort:{createdAt:-1}}); if(!otp||otp.attempts>=otp.maxAttempts) return fail(res,401,'OTP_INVALID','Code is invalid or expired'); if(!await bcrypt.compare(input.code,otp.codeHash)){await db.collection('otpSessions').updateOne({_id:otp._id},{$inc:{attempts:1}});return fail(res,401,'OTP_INVALID','Code is invalid or expired');} await db.collection('otpSessions').updateOne({_id:otp._id},{$set:{usedAt:new Date()}}); let user=await db.collection<User>('users').findOne({email:input.email}); if(!user){const now=new Date();const r=await db.collection<User>('users').insertOne({name:input.email.split('@')[0],email:input.email,role:'user',emailVerifiedAt:now,createdAt:now,updatedAt:now});user={_id:r.insertedId,name:input.email.split('@')[0],email:input.email,role:'user',emailVerifiedAt:now,createdAt:now,updatedAt:now};await db.collection('profiles').insertOne({userId:r.insertedId,personal:{email:input.email},sections:{},createdAt:now,updatedAt:now});} await createSession(res,user._id!);return ok(res,{user:{id:user._id,name:user.name,email:user.email,role:user.role}}); }));

router.post('/forgot-password/request-otp', asyncRoute(async (req, res) => {
  const { email: address } = req.body;
  if (!address || typeof address !== 'string') return fail(res, 400, 'EMAIL_REQUIRED', 'Email address is required');
  const db = await database();
  const user = await db.collection<User>('users').findOne({ email: address.toLowerCase().trim() });
  if (!user) return fail(res, 404, 'USER_NOT_FOUND', 'No account found with this email address');
  
  const key = sha(`${req.ip}:${address}`);
  const recent = await db.collection('otpSessions').countDocuments({ rateKey: key, createdAt: { $gt: new Date(Date.now() - 3600000) } });
  if (recent >= 5) return fail(res, 429, 'OTP_RATE_LIMIT', 'Too many requests. Please try again later.');

  const value = code(), now = new Date();
  await db.collection('otpSessions').updateMany({ email: address.toLowerCase().trim(), usedAt: { $exists: false } }, { $set: { usedAt: now } });
  await db.collection('otpSessions').insertOne({ email: address.toLowerCase().trim(), codeHash: await bcrypt.hash(value, 12), rateKey: key, attempts: 0, maxAttempts: 5, createdAt: now, expiresAt: new Date(Date.now() + 600000) });
  await sendOtpEmail(address.toLowerCase().trim(), value);
  return ok(res, { message: 'Password reset OTP code sent to your email.' }, 200);
}));

router.post('/forgot-password/reset-password', asyncRoute(async (req, res) => {
  const { email: address, code: inputCode, newPassword } = req.body;
  if (!address || !inputCode || !newPassword) return fail(res, 400, 'FIELDS_REQUIRED', 'Email, OTP code, and new password are required');
  if (newPassword.length < 6) return fail(res, 400, 'WEAK_PASSWORD', 'Password must be at least 6 characters');

  const db = await database();
  const otp = await db.collection('otpSessions').findOne({ email: address.toLowerCase().trim(), usedAt: { $exists: false }, expiresAt: { $gt: new Date() } }, { sort: { createdAt: -1 } });
  if (!otp || otp.attempts >= otp.maxAttempts) return fail(res, 401, 'OTP_INVALID', 'Invalid or expired OTP code');
  if (!await bcrypt.compare(inputCode, otp.codeHash)) {
    await db.collection('otpSessions').updateOne({ _id: otp._id }, { $inc: { attempts: 1 } });
    return fail(res, 401, 'OTP_INVALID', 'Invalid OTP code');
  }

  await db.collection('otpSessions').updateOne({ _id: otp._id }, { $set: { usedAt: new Date() } });
  const newPasswordHash = await bcrypt.hash(newPassword, 12);
  const now = new Date();
  await db.collection<User>('users').updateOne({ email: address.toLowerCase().trim() }, { $set: { passwordHash: newPasswordHash, updatedAt: now } });

  const user = await db.collection<User>('users').findOne({ email: address.toLowerCase().trim() });
  if (user) {
    await createSession(res, user._id!);
    return ok(res, { user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  }

  return ok(res, { message: 'Password reset successfully!' });
}));

export default router;
