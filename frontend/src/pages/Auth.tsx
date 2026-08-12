import { BrandLogo } from '../components/BrandLogo.js';

export function Auth({ signup = false }: { signup?: boolean }) {
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [showTransition, setShowTransition] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [transitionStatus, setTransitionStatus] = useState('Authenticating session...');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      if (mode === 'otp') {
        if (!otpSent) {
          await api('/auth/otp/request', {
            method: 'POST',
            body: JSON.stringify({ email: email.trim() }),
          });
          setInfo('Verification code sent to your email.');
          setOtpSent(true);
          setLoading(false);
          return;
        }

        if (!code.trim()) {
          setError('Please enter the 6-digit verification code');
          setLoading(false);
          return;
        }

        const res = await api<Session>('/auth/otp/verify', {
          method: 'POST',
          body: JSON.stringify({ email: email.trim(), code: code.trim() }),
        });
        if (res?.csrfToken) setCsrf(res.csrfToken);
      } else {
        const res = await api<Session>(signup ? '/auth/register' : '/auth/login', {
          method: 'POST',
          body: JSON.stringify(signup ? { name, email, password } : { email, password }),
        });
        if (res?.csrfToken) setCsrf(res.csrfToken);
      }

      // Trigger cool transition popup
      setShowTransition(true);
      setTransitionProgress(15);
      setTransitionStatus('Authentication verified! 🔒');

      setTimeout(() => {
        setTransitionProgress(55);
        setTransitionStatus('Preparing your Dashboard workspace... ⚡');
      }, 400);

      setTimeout(() => {
        setTransitionProgress(90);
        setTransitionStatus('Loading career profile & templates... ☕');
      }, 900);

      await queryClient.invalidateQueries({ queryKey: ['session'] });

      setTimeout(() => {
        setTransitionProgress(100);
        setTransitionStatus('Welcome! Launching Dashboard... 🚀');
        setTimeout(() => {
          nav('/dashboard');
        }, 300);
      }, 1400);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setShowTransition(false);
      setLoading(false);
    }
  };

  const googleUrl = `${apiBase}/auth/google`;

  return (
    <div className="auth-page-container">
      <div className="auth-layout-grid">
        {/* Left Side: Coffee Cup Logo & Brand Showcase */}
        <div className="auth-left-card">
          <div className="auth-left-header">
            <BrandLogo to="/" size="lg" />
          </div>

          <div className="auth-gif-wrapper">
            <img
              src="/logo.png"
              alt="Big dreams. Better resume."
              className="auth-coffee-gif"
              style={{ width: '160px', height: '160px', objectFit: 'contain' }}
            />
          </div>

          <div className="auth-left-content">
            <h2>Craft resumes that get you hired.</h2>
            <p>Built with AI resume parsing, Groq speed, and instant A4 PDF exports.</p>
          </div>
        </div>

        {/* Right Side: Interactive Auth Form Card */}
        <div className="auth-form-card" style={{ padding: '32px' }}>
          <div className="auth-form-header" style={{ marginBottom: '20px' }}>
            <BrandLogo to="/" size="md" />
            <p className="eyebrow" style={{ marginTop: '14px' }}>{signup ? 'CREATE ACCOUNT' : 'WELCOME BACK'}</p>
            <h1 style={{ fontSize: '24px', margin: '0 0 6px' }}>{signup ? 'Start building for free' : 'Log in to HireUp'}</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', margin: '0 0 20px', lineHeight: '1.5' }}>
              Save your career profile and craft recruiter-ready resumes in minutes.
            </p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {info && <div className="alert alert-success">{info}</div>}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {signup && mode === 'password' && (
              <div>
                <label>Full Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Mahesh Kumar" />
              </div>
            )}

            <div>
              <label>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>

             {mode === 'password' ? (
              <div>
                <label>Password</label>
                <input
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="At least 6 characters"
                />
              </div>
            ) : (
              <div>
                <label>6-Digit Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required={otpSent}
                  placeholder="123456"
                  style={{ letterSpacing: '0.25em', fontSize: '18px', fontWeight: 800, textAlign: 'center' }}
                />
                {otpSent && (
                  <div style={{ textAlign: 'right', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="text-button"
                      style={{ fontSize: '11px', color: '#FF2D55', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                      onClick={async () => {
                        setError('');
                        setInfo('');
                        try {
                          await api('/auth/otp/request', {
                            method: 'POST',
                            body: JSON.stringify({ email: email.trim() }),
                          });
                          setInfo('A fresh 6-digit verification code has been sent to your email.');
                        } catch (err: any) {
                          setError(err?.message || 'Failed to resend code.');
                        }
                      }}
                    >
                      Resend Code 🔄
                    </button>
                  </div>
                )}
              </div>
            )}

            {!signup && mode === 'password' && (
              <div style={{ textAlign: 'right', marginTop: -4, marginBottom: 8 }}>
                <Link to="/forgot-password" style={{ fontSize: '12px', fontWeight: 600, color: '#FF2D55', textDecoration: 'none' }}>
                  Forgot Password? 🔑
                </Link>
              </div>
            )}

            <button className="button" type="submit" disabled={loading} style={{ marginTop: '6px' }}>
              {loading
                ? 'Processing…'
                : mode === 'otp'
                ? otpSent
                  ? 'Verify Code & Log In ➔'
                  : 'Send Email Verification Code ➔'
                : signup
                ? 'Create account'
                : 'Log in'}
            </button>

            <button
              type="button"
              className="text-button"
              style={{ fontSize: '12px', margin: '0 auto' }}
              onClick={() => {
                setMode(mode === 'otp' ? 'password' : 'otp');
                setCode('');
                setOtpSent(false);
                setError('');
                setInfo('');
              }}
            >
              {mode === 'otp' ? 'Use password instead' : 'Sign in with email OTP code'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '12px' }}>
              {signup ? 'Already have an account?' : 'New to HireUp AI?'}{' '}
              <Link to={signup ? '/login' : '/signup'} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                {signup ? 'Log in' : 'Create an account'}
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Dashboard Launching Popup Modal */}
      {showTransition && (
        <div className="dashboard-launch-backdrop">
          <div className="dashboard-launch-card">
            <div className="launch-coffee-ring">
              <img src="/coffee-cup.gif" alt="Brewing Dashboard" className="launch-coffee-gif" />
            </div>
            <h3 className="launch-title">Entering Workspace</h3>
            <p className="launch-status">{transitionStatus}</p>
            <div className="launch-progress-bar">
              <div className="launch-progress-fill" style={{ width: `${transitionProgress}%` }} />
            </div>
            <div className="launch-badge">☕ HireUp AI Dashboard</div>
          </div>
        </div>
      )}
    </div>
  );
}
