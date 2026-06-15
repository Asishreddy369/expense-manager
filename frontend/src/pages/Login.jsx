import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2, KeyRound, Info } from 'lucide-react';

const Login = () => {
  const [mode, setMode] = useState('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const { login, requestOtp, loginWithOtp } = useAuth();
  const navigate = useNavigate();

  const resetFeedback = () => { setError(''); setMessage(''); };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    resetFeedback();
    setLoading(true);
    const result = await login(identifier, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleRequestOtp = async () => {
    if (!identifier.trim()) {
      setError('Enter your username or email first.');
      return;
    }
    resetFeedback();
    setOtpSending(true);
    const result = await requestOtp(identifier);
    if (result.success) {
      setMessage('OTP sent! Check your email, or use the common OTP if email is not configured.');
      setOtpRequested(true);
    } else {
      // Even if email send fails, allow OTP entry (common OTP still works)
      setMessage('Email not configured. You can still use the common OTP below.');
      setOtpRequested(true);
    }
    setOtpSending(false);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    resetFeedback();
    setLoading(true);
    const result = await loginWithOtp(identifier, otp);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-500 text-sm">Sign in with password or OTP.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700 flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              {message}
            </div>
          )}

          {/* Mode tabs */}
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => { setMode('password'); resetFeedback(); }}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${mode === 'password' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => { setMode('otp'); resetFeedback(); setOtpRequested(false); }}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${mode === 'otp' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              OTP
            </button>
          </div>

          <form onSubmit={mode === 'password' ? handlePasswordSubmit : handleOtpSubmit} className="space-y-5">
            {/* Username / Email field */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Username or Email</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  className="block w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                  placeholder="Username or email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            {mode === 'password' ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full rounded-xl border border-gray-200 py-3 pl-10 pr-10 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* OTP entry — always visible, send button is optional */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">One-Time Password</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <KeyRound className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      className="block w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">
                    Enter the OTP sent to your email.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={otpSending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-blue-50 disabled:opacity-60"
                >
                  {otpSending ? <Loader2 className="h-4 w-4 animate-spin" /> : otpRequested ? 'Resend OTP to Email' : 'Send OTP to Email'}
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                Remember Me
              </label>
              <a href="#" className="text-sm font-medium text-primary hover:text-blue-700">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : mode === 'password' ? (
                'Sign In'
              ) : (
                'Verify OTP & Sign In'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:text-blue-700">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
