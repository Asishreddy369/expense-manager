import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';

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
  const { login, requestOtp, loginWithOtp } = useAuth();
  const navigate = useNavigate();

  const resetFeedback = () => {
    setError('');
    setMessage('');
  };

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
      setMessage(result.message);
    } else {
      setError(result.error);
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
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-500 text-sm">Choose password login or get a one-time password by email.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 rounded-lg border border-green-100 bg-green-50 p-4 text-sm text-green-700">
              {message}
            </div>
          )}

          <div className="mb-6 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('password');
                resetFeedback();
              }}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                mode === 'password' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('otp');
                resetFeedback();
              }}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                mode === 'otp' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              OTP
            </button>
          </div>

          <form onSubmit={mode === 'password' ? handlePasswordSubmit : handleOtpSubmit} className="space-y-6">
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
                  placeholder="Enter your username or email"
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
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={otpSending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary px-4 py-3 font-semibold text-primary transition-all hover:bg-blue-50"
                >
                  {otpSending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send OTP to Email'}
                </button>

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
                      placeholder="Enter the 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label className="ml-2 block text-sm text-gray-700">Remember Me</label>
              </div>
              <a href="#" className="text-sm font-medium text-primary transition-colors hover:text-blue-700">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : mode === 'password' ? (
                'Sign In with Password'
              ) : (
                'Verify OTP'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary transition-colors hover:text-blue-700">
              Sign up free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
