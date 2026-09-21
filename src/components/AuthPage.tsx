import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  X,
  KeyRound,
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
import { BRAND_ICON } from '../lib/brandAssets';
import { 
  syncUserProfileToDb, 
  triggerWelcomeEmail
} from '../services/firestoreService';
import { 
  ADMIN_EMAIL, 
  isUserAdmin, 
  getMasterAdminProfile 
} from '../lib/authHelpers';
import { setAdminSessionVerified } from '../services/adminOtpService';
import { UserProfile, LegalDocId } from '../types';
import { PhoneInputWithCountry } from './PhoneInputWithCountry';
import { COUNTRY_PHONE_CODES, CountryPhoneCode } from '../data/countryCodes';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

interface AuthPageProps {
  initialTab?: 'signin' | 'signup';
  onSuccessRedirect?: (role: 'customer' | 'admin', user: UserProfile) => void;
  onNavigateHome: () => void;
  onNavigateLegal?: (docId: LegalDocId) => void;
  onOpenLegalModal?: (type: 'Privacy Policy' | 'Terms & Conditions' | 'Refund Policy') => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialTab = 'signin',
  onSuccessRedirect,
  onNavigateHome,
  onNavigateLegal,
  onOpenLegalModal
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialTab);

  // Sign In Form States
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInShowPassword, setSignInShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up Form States
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpCountry, setSignUpCountry] = useState<CountryPhoneCode>(() => COUNTRY_PHONE_CODES[0]);
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpShowPassword, setSignUpShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Error & Loading States
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; title: string } | null>(null);

  // Forgot Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const signInEmailRef = useRef<HTMLInputElement>(null);
  const signUpNameRef = useRef<HTMLInputElement>(null);

  // Auto-redirect if already authenticated
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('zdf_auth_user');
      if (saved) {
        const userObj = JSON.parse(saved);
        if (userObj && (userObj.uid || userObj.email)) {
          if (onSuccessRedirect) {
            onSuccessRedirect(userObj.role || 'customer', userObj);
          } else {
            onNavigateHome();
          }
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (activeTab === 'signin') {
      signInEmailRef.current?.focus();
    } else {
      signUpNameRef.current?.focus();
    }
  }, [activeTab]);

  const isValidEmail = (email: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setFormError(null);
    setFieldErrors({});
    setIsGoogleLoading(true);

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
        displayName: userProfile.displayName,
        email: userProfile.email,
        role: userProfile.role,
        photoURL: userProfile.photoURL || '',
        membershipStatus: userProfile.membershipStatus || 'free',
        createdAt: userProfile.createdAt,
        lastLoginAt: new Date().toISOString(),
        ordersCount: userProfile.ordersCount || 0,
        loggedInAt: new Date().toISOString()
      }));

      setToastMessage({
        type: 'success',
        title: `Welcome, ${userProfile.displayName}!`
      });

      setTimeout(() => {
        if (onSuccessRedirect) {
          onSuccessRedirect(userProfile.role, userProfile);
        } else {
          onNavigateHome();
        }
      }, 700);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      setFormError('Google sign-in could not be completed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Sign In Submit
  const handleSignInSubmit = async (e: React.FormEvent) => {
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

    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, signInEmail.trim(), signInPassword);
      const user = userCredential.user;

      const userProfile = await syncUserProfileToDb({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0]
      });

      if (userProfile.role === 'admin' || isUserAdmin(user.email)) {
        // Admin OTP MFA is required to protect panel
      }

      sessionStorage.setItem('zdf_auth_user', JSON.stringify({
        uid: user.uid,
        name: userProfile.displayName,
        displayName: userProfile.displayName,
        email: userProfile.email,
        role: userProfile.role,
        photoURL: userProfile.photoURL || '',
        membershipStatus: userProfile.membershipStatus || 'free',
        createdAt: userProfile.createdAt,
        lastLoginAt: new Date().toISOString(),
        ordersCount: userProfile.ordersCount || 0,
        loggedInAt: new Date().toISOString()
      }));

      setToastMessage({
        type: 'success',
        title: `Welcome back, ${userProfile.displayName}!`
      });

      setTimeout(() => {
        if (onSuccessRedirect) {
          onSuccessRedirect(userProfile.role, userProfile);
        } else {
          onNavigateHome();
        }
      }, 700);
    } catch (err: any) {
      const errorCode = err?.code || '';
      if (
        errorCode === 'auth/wrong-password' || 
        errorCode === 'auth/user-not-found' || 
        errorCode === 'auth/invalid-credential'
      ) {
        setFormError('Incorrect email or password');
      } else if (errorCode === 'auth/too-many-requests') {
        setFormError('Too many attempts. Please try again later or reset password.');
      } else {
        setFormError('Sign in failed. Please check your details and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up Submit
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const errors: { [key: string]: string } = {};

    if (!signUpName.trim()) {
      errors.name = 'Please enter your name';
    }
    if (!signUpEmail || !isValidEmail(signUpEmail)) {
      errors.email = 'Please enter a valid email';
    }
    if (!signUpPassword || signUpPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (!agreeTerms) {
      errors.terms = 'You must accept the terms';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        signUpEmail.trim().toLowerCase(), 
        signUpPassword
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: signUpName.trim() });

      // Format phone with country dial code
      let formattedPhone = signUpPhone.trim();
      if (formattedPhone && !formattedPhone.startsWith('+')) {
        const cleanDigits = formattedPhone.replace(/^0+/, '');
        formattedPhone = `${signUpCountry.dialCode} ${cleanDigits}`;
      }

      const userProfile = await syncUserProfileToDb({
        uid: user.uid,
        email: user.email,
        displayName: signUpName.trim(),
        phone: formattedPhone || undefined
      });

      sessionStorage.setItem('zdf_auth_user', JSON.stringify({
        uid: user.uid,
        name: userProfile.displayName,
        displayName: userProfile.displayName,
        email: userProfile.email,
        role: userProfile.role,
        photoURL: userProfile.photoURL || '',
        membershipStatus: userProfile.membershipStatus || 'free',
        createdAt: userProfile.createdAt,
        lastLoginAt: new Date().toISOString(),
        ordersCount: userProfile.ordersCount || 0,
        loggedInAt: new Date().toISOString()
      }));

      triggerWelcomeEmail(userProfile.email, userProfile.displayName);

      setToastMessage({
        type: 'success',
        title: 'Account created successfully!'
      });

      setTimeout(() => {
        if (onSuccessRedirect) {
          onSuccessRedirect('customer', userProfile);
        } else {
          onNavigateHome();
        }
      }, 700);
    } catch (err: any) {
      console.error('Sign up error details:', err);
      const errorCode = err?.code || '';
      const errorMessage = err?.message || 'Please try again.';
      if (errorCode === 'auth/email-already-in-use') {
        setFormError('An account with this email already exists. Try signing in.');
      } else if (errorCode === 'auth/weak-password') {
        setFieldErrors({ password: 'Password should be at least 6 characters.' });
      } else {
        setFormError(`Account creation failed: ${errorMessage} (${errorCode || 'unknown-error'})`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Password Reset
  const handleSendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (!forgotEmail || !isValidEmail(forgotEmail)) {
      setForgotError('Please enter a valid email');
      return;
    }

    setForgotLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      setForgotSuccess(true);
    } catch (err: any) {
      setForgotSuccess(true);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-center items-center p-4">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="px-4 py-3 rounded-xl bg-slate-900 border border-[#22C55E]/40 text-white flex items-center gap-2.5 shadow-xl">
            <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
            <span className="font-semibold text-sm">{toastMessage.title}</span>
          </div>
        </div>
      )}

      {/* Main Clean Centered Auth Container */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        
        {/* Top Back Navigation & Logo */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#28B9FF]" />
            <span>Back to Store</span>
          </button>

          <div 
            onClick={onNavigateHome}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <img 
              src={BRAND_ICON} 
              alt="Logo" 
              className="w-8 h-8 object-cover rounded-full p-0.5 bg-[#0A0F1D] border border-[#28B9FF] shadow-md shadow-[#0D6EFD]/25 transition-transform duration-200 group-hover:scale-110"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== window.location.origin + '/icon.png') {
                  target.src = '/icon.png';
                }
              }}
            />
            <span className="font-bold text-sm tracking-tight text-white group-hover:text-[#28B9FF] transition-colors duration-200">
              Zohaib <span className="text-[#28B9FF] group-hover:text-white transition-colors duration-200">DigiForge</span>
            </span>
          </div>
        </div>

        {/* Card Box */}
        <div className="bg-[#0D1527] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          
          {/* Tab Toggle: Sign In / Sign Up */}
          <div className="p-1 bg-slate-950 border border-slate-800/80 rounded-xl flex gap-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setFormError(null);
                setFieldErrors({});
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'signin'
                  ? 'bg-[#0D6EFD] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setFormError(null);
                setFieldErrors({});
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'signup'
                  ? 'bg-[#22C55E] text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Quick Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition-colors flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer shadow-sm"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-5">
            <div className="w-full border-t border-slate-800" />
            <span className="absolute px-3 bg-[#0D1527] text-[11px] font-medium text-slate-500 uppercase">
              OR
            </span>
          </div>

          {/* General Error Banner */}
          {formError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    ref={signInEmailRef}
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#0D6EFD]"
                  />
                </div>
                {fieldErrors.email && <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type={signInShowPassword ? 'text' : 'password'}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#0D6EFD]"
                  />
                  <button
                    type="button"
                    onClick={() => setSignInShowPassword(!signInShowPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {signInShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.password}</p>}
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
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
                    setForgotSuccess(false);
                    setForgotError(null);
                    setForgotModalOpen(true);
                  }}
                  className="text-[#28B9FF] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer shadow-lg shadow-[#0D6EFD]/20 mt-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* SIGN UP FORM */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    ref={signUpNameRef}
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="e.g. Ali Ahmed"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#22C55E]"
                  />
                </div>
                {fieldErrors.name && <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#22C55E]"
                  />
                </div>
                {fieldErrors.email && <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  WhatsApp / Phone Number
                </label>
                <PhoneInputWithCountry
                  id="auth-signup-phone"
                  value={signUpPhone}
                  onChange={(val) => setSignUpPhone(val)}
                  selectedCountry={signUpCountry}
                  onCountryChange={(c) => setSignUpCountry(c)}
                />
                <p className="text-[10px] text-slate-400 mt-1">For instant order delivery &amp; tracking</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type={signUpShowPassword ? 'text' : 'password'}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#22C55E]"
                  />
                  <button
                    type="button"
                    onClick={() => setSignUpShowPassword(!signUpShowPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {signUpShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.password}</p>}
                <PasswordStrengthIndicator password={signUpPassword} />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-950 text-[#22C55E]"
                  />
                  <span>
                    I agree to{' '}
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenLegalModal) onOpenLegalModal('Terms & Conditions');
                        else if (onNavigateLegal) onNavigateLegal('terms');
                      }}
                      className="text-[#28B9FF] hover:underline"
                    >
                      Terms &amp; Conditions
                    </button>
                  </span>
                </label>
                {fieldErrors.terms && <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.terms}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#22C55E] hover:bg-[#1ea850] text-slate-950 font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer shadow-lg shadow-[#22C55E]/20 mt-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick WhatsApp Support Link */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Need help?{' '}
            <a
              href="https://wa.me/923406070632?text=Hello%20Zohaib%20DigiForge%20Support,%20I%20need%20help%20with%20my%20account"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#22C55E] font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Chat on WhatsApp</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

        </div>
      </div>

      {/* Password Reset Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {forgotSuccess ? (
              <div className="text-center py-2 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#22C55E] mx-auto" />
                <h4 className="font-bold text-white text-base">Check your email</h4>
                <p className="text-xs text-slate-400">
                  A password reset link was sent to <strong>{forgotEmail}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="w-full py-2 rounded-xl bg-slate-800 text-xs font-semibold text-white mt-2"
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <KeyRound className="w-5 h-5 text-[#28B9FF]" />
                  <h4 className="font-bold text-white text-base">Reset Password</h4>
                </div>

                {forgotError && (
                  <p className="text-xs text-rose-400 mb-3">{forgotError}</p>
                )}

                <form onSubmit={handleSendPasswordReset} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#0D6EFD]"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(false)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-2 rounded-xl bg-[#0D6EFD] text-white text-xs font-bold"
                    >
                      {forgotLoading ? 'Sending...' : 'Send Link'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
