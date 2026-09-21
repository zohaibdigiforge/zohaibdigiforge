import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  KeyRound, 
  CheckCircle2,
  ExternalLink,
  Phone
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { syncUserProfileToDb, triggerWelcomeEmail } from '../services/firestoreService';
import { 
  ADMIN_EMAIL, 
  isUserAdmin, 
  getMasterAdminProfile 
} from '../lib/authHelpers';
import { setAdminSessionVerified } from '../services/adminOtpService';
import { UserProfile } from '../types';
import { PhoneInputWithCountry } from './PhoneInputWithCountry';
import { COUNTRY_PHONE_CODES, CountryPhoneCode } from '../data/countryCodes';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onSuccess?: (user: UserProfile) => void;
  onOpenFullAuthPage?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  onSuccess,
  onOpenFullAuthPage
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  
  // Sign In States
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInShowPassword, setSignInShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up States
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpCountry, setSignUpCountry] = useState<CountryPhoneCode>(() => COUNTRY_PHONE_CODES[0]);
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpShowPassword, setSignUpShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Error & Loading States
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forgot Password States
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setFormError(null);
    setFieldErrors({});
    setShowForgot(false);
    setForgotSent(false);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const isValidEmail = (email: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    setFieldErrors({});
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userProfile = await syncUserProfileToDb({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
        photoURL: user.photoURL
      });

      sessionStorage.setItem('zdf_auth_user', JSON.stringify({
        uid: user.uid,
        name: userProfile.displayName,
        email: userProfile.email,
        role: userProfile.role,
        photoURL: userProfile.photoURL,
        loggedInAt: new Date().toISOString()
      }));

      if (onSuccess) onSuccess(userProfile);
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
      setFormError('Google sign-in could not be completed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (!signInEmail || !isValidEmail(signInEmail)) {
      setFieldErrors({ email: 'Please enter a valid email' });
      return;
    }
    if (!signInPassword) {
      setFieldErrors({ password: 'Password is required' });
      return;
    }

    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, signInEmail.trim(), signInPassword);
      const user = cred.user;

      const userProfile = await syncUserProfileToDb({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0]
      });

      sessionStorage.setItem('zdf_auth_user', JSON.stringify({
        uid: user.uid,
        name: userProfile.displayName,
        email: userProfile.email,
        role: userProfile.role,
        loggedInAt: new Date().toISOString()
      }));

      if (onSuccess) onSuccess(userProfile);
      onClose();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setFormError('Incorrect email or password');
      } else {
        setFormError('Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const errors: { [key: string]: string } = {};
    if (!signUpName.trim()) errors.name = 'Please enter your name';
    if (!signUpEmail || !isValidEmail(signUpEmail)) errors.email = 'Please enter a valid email';
    if (!signUpPassword || signUpPassword.length < 6) errors.password = 'Password must be at least 6 characters';
    if (!agreeTerms) errors.terms = 'You must accept the terms';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, signUpEmail.trim().toLowerCase(), signUpPassword);
      const user = cred.user;

      // Format phone with country code
      let formattedPhone = signUpPhone.trim();
      if (formattedPhone && !formattedPhone.startsWith('+')) {
        const cleanDigits = formattedPhone.replace(/^0+/, '');
        formattedPhone = `${signUpCountry.dialCode} ${cleanDigits}`;
      }

      await updateProfile(user, { displayName: signUpName.trim() });
      const userProfile = await syncUserProfileToDb({
        uid: user.uid,
        email: user.email,
        displayName: signUpName.trim(),
        phone: formattedPhone || undefined
      });

      sessionStorage.setItem('zdf_auth_user', JSON.stringify({
        uid: user.uid,
        name: userProfile.displayName,
        email: userProfile.email,
        role: userProfile.role,
        loggedInAt: new Date().toISOString()
      }));

      triggerWelcomeEmail(userProfile.email, userProfile.displayName);

      if (onSuccess) onSuccess(userProfile);
      onClose();
    } catch (err: any) {
      console.error('Sign up modal error details:', err);
      const code = err?.code || '';
      const message = err?.message || 'Please try again.';
      if (code === 'auth/email-already-in-use') {
        setFormError('An account with this email already exists.');
      } else if (code === 'auth/weak-password') {
        setFieldErrors({ password: 'Password must be at least 6 characters' });
      } else {
        setFormError(`Account creation failed: ${message} (${code || 'unknown-error'})`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !isValidEmail(forgotEmail)) {
      setFormError('Please enter a valid email');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      setForgotSent(true);
    } catch {
      setForgotSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="relative w-full max-w-sm bg-[#0D1527] border border-slate-800 rounded-2xl p-6 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {showForgot ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-5 h-5 text-[#28B9FF]" />
              <h3 className="text-base font-bold text-white">Reset Password</h3>
            </div>

            {forgotSent ? (
              <div className="text-center py-4 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#22C55E] mx-auto" />
                <h4 className="text-sm font-bold text-white">Check your email</h4>
                <p className="text-xs text-slate-400">
                  Password reset link sent to <strong>{forgotEmail}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 text-white text-xs font-semibold"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#0D6EFD]"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-[#0D6EFD] text-white text-xs font-bold"
                  >
                    {loading ? 'Sending...' : 'Send Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div>
            {/* Tab Toggle */}
            <div className="p-1 bg-slate-950 border border-slate-800/80 rounded-xl flex gap-1 mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setFormError(null);
                  setFieldErrors({});
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  mode === 'signin'
                    ? 'bg-[#0D6EFD] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setFormError(null);
                  setFieldErrors({});
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  mode === 'signup'
                    ? 'bg-[#22C55E] text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-colors flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-60 cursor-pointer mb-4"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center my-4">
              <div className="w-full border-t border-slate-800" />
              <span className="absolute px-2.5 bg-[#0D1527] text-[10px] uppercase font-bold text-slate-500">
                OR
              </span>
            </div>

            {formError && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {mode === 'signup' ? (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      placeholder="e.g. Ali Ahmed"
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>
                  {fieldErrors.name && <p className="text-[10px] text-rose-400 mt-1">{fieldErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>
                  {fieldErrors.email && <p className="text-[10px] text-rose-400 mt-1">{fieldErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp / Phone Number</label>
                  <PhoneInputWithCountry
                    id="signup-whatsapp-phone"
                    value={signUpPhone}
                    onChange={(val) => setSignUpPhone(val)}
                    selectedCountry={signUpCountry}
                    onCountryChange={(c) => setSignUpCountry(c)}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">For instant order delivery &amp; tracking</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={signUpShowPassword ? 'text' : 'password'}
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#22C55E]"
                    />
                    <button
                      type="button"
                      onClick={() => setSignUpShowPassword(!signUpShowPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                    >
                      {signUpShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="text-[10px] text-rose-400 mt-1">{fieldErrors.password}</p>}
                  <PasswordStrengthIndicator password={signUpPassword} />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 pt-1">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-950 text-[#22C55E]"
                  />
                  <span>I agree to terms &amp; conditions</span>
                </label>
                {fieldErrors.terms && <p className="text-[10px] text-rose-400">{fieldErrors.terms}</p>}

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#1ea850] text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignIn} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#0D6EFD]"
                    />
                  </div>
                  {fieldErrors.email && <p className="text-[10px] text-rose-400 mt-1">{fieldErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={signInShowPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#0D6EFD]"
                    />
                    <button
                      type="button"
                      onClick={() => setSignInShowPassword(!signInShowPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                    >
                      {signInShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="text-[10px] text-rose-400 mt-1">{fieldErrors.password}</p>}
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950 text-[#0D6EFD]"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(signInEmail);
                      setShowForgot(true);
                      setForgotSent(false);
                    }}
                    className="text-[#28B9FF] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full py-2.5 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )}

            {onOpenFullAuthPage && (
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFullAuthPage();
                  }}
                  className="text-xs text-slate-400 hover:text-[#28B9FF] transition-colors inline-flex items-center gap-1 font-medium"
                >
                  <span>Open Full Screen Page</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
