import { BrandLogo } from '../components/BrandLogo.js';

export function ForgotPassword() {
  const nav = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const digitRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    setError(null);
    try {
      await api('/auth/forgot-password/request-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setStep(2);
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP code. Check your email address.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Digit Handlers
  const handleDigitChange = (index: number, value: string) => {
    const char = value.slice(-1);
    if (!/^\d*$/.test(char)) return;

    const nextDigits = [...otpDigits];
    nextDigits[index] = char;
    setOtpDigits(nextDigits);

    if (char && index < 5) {
      digitRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtpDigits(digits);
      digitRefs[5].current?.focus();
    }
  };

  // Submit OTP & Proceed to Password
  const handleVerifyOtpStep = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of the verification code');
      return;
    }
    setError(null);
    setStep(3);
  };

  // Reset Password & Login
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api('/auth/forgot-password/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email,
          code,
          newPassword,
        }),
      });

      setStep(4);
      setTimeout(() => {
        nav('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Password reset failed. Check your OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Password Strength
  const getStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 30;
    if (pass.length >= 10) score += 20;
    if (/[A-Z]/.test(pass)) score += 20;
    if (/[0-9]/.test(pass)) score += 15;
    if (/[^A-Za-z0-9]/.test(pass)) score += 15;
    return score;
  };

  const strength = getStrength(newPassword);

  return (
    <div className="award-auth-wrapper">
      <div className="award-auth-bg-glow" />

      <div className="award-auth-card">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <BrandLogo to="/" size="lg" />
        </div>

        {/* Step Indicator */}
        <div className="award-step-bar">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`} />
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`step-line ${step >= 3 ? 'active' : ''}`} />
          <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        {error && <div className="award-error-alert">⚠️ {error}</div>}

        {/* Step 1: Request OTP */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="award-form-step">
            <h2 className="award-title">Forgot Password?</h2>
            <p className="award-subtitle">Enter your account email to receive a 6-digit verification code.</p>

            <label className="v2-input-field">
              <span>Account Email</span>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <button type="submit" className="award-primary-btn" disabled={loading}>
              {loading ? 'Sending Code...' : 'Send Verification OTP ➔'}
            </button>

            <div className="award-bottom-link">
              Remember your password? <Link to="/login">Sign In</Link>
            </div>
          </form>
        )}

        {/* Step 2: 6-Digit OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtpStep} className="award-form-step">
            <h2 className="award-title">Enter 6-Digit Code</h2>
            <p className="award-subtitle">We sent a 6-digit code to <strong>{email}</strong></p>

            <div className="award-otp-grid" onPaste={handlePaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={digitRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={digit ? 'filled' : ''}
                />
              ))}
            </div>

            <button type="submit" className="award-primary-btn" disabled={otpDigits.join('').length < 6}>
              Verify Code ➔
            </button>

            <div className="award-resend-row">
              Didn’t get a code?{' '}
              <button type="button" className="award-link-btn" onClick={handleRequestOtp}>
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="award-form-step">
            <h2 className="award-title">Reset Your Password</h2>
            <p className="award-subtitle">Create a strong, new password for your account.</p>

            <label className="v2-input-field">
              <span>New Password</span>
              <div className="award-pass-input-box">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? '👁️' : '🔒'}
                </button>
              </div>
            </label>

            {/* Strength meter */}
            {newPassword && (
              <div className="award-strength-wrapper">
                <div className="award-strength-bar">
                  <div
                    className="award-strength-fill"
                    style={{
                      width: `${strength}%`,
                      background: strength > 70 ? '#10B981' : strength > 40 ? '#F59E0B' : '#EF4444',
                    }}
                  />
                </div>
                <span>{strength > 70 ? 'Strong 💪' : strength > 40 ? 'Medium ⚖️' : 'Weak ⚠️'}</span>
              </div>
            )}

            <label className="v2-input-field" style={{ marginTop: 10 }}>
              <span>Confirm New Password</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter new password..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>

            <button type="submit" className="award-primary-btn" disabled={loading} style={{ marginTop: 16 }}>
              {loading ? 'Updating Password...' : 'Save New Password & Log In 🎉'}
            </button>
          </form>
        )}

        {/* Step 4: Celebration Success */}
        {step === 4 && (
          <div className="award-success-step">
            <div className="award-checkmark-circle">✓</div>
            <h2>Password Reset Complete! 🎉</h2>
            <p>Your password has been updated. Logging you into your workspace automatically...</p>
          </div>
        )}
      </div>
    </div>
  );
}
