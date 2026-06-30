import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { api } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    zip: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.zip.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        zip_code: form.zip.trim(),
      });

      // Save token if returned
      if (data.token) {
        localStorage.setItem('kidcircle_session', data.token);
      }

      setSuccess(true);
      // Wait a bit so user can see success state
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pb-32">
      <SEO
        title="Create Account"
        description="Sign up for KidCircle and join Austin's trusted parent network for enrichment recommendations, camp swaps, and more."
        url="/register"
      />

      <div className="pt-6 mb-6">
        <h1 className="text-xl font-bold text-text mb-1">Create Account</h1>
        <p className="text-xs text-text-light">Join <strong>2,400+</strong> Austin parents who trust KidCircle</p>
      </div>

      {success ? (
        <div className="bg-green-50 rounded-2xl p-8 text-center border border-green-100">
          <span className="text-4xl block mb-3">🎉</span>
          <h2 className="text-lg font-bold text-text mb-2">Account Created!</h2>
          <p className="text-sm text-text-light mb-4">Welcome to the circle. Redirecting you to your profile...</p>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {/* Key benefits */}
          <div className="bg-gradient-to-r from-primary/5 to-blue-50 rounded-2xl p-4 mb-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-lg">✨</span>
              <p className="text-sm font-semibold text-text">Free membership includes:</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-text-light">
              <div className="flex items-center gap-1.5">
                <span className="text-green-500">✓</span> Personalized recommendations
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-green-500">✓</span> 150+ verified providers
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-green-500">✓</span> Parent reviews & ratings
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-green-500">✓</span> Camp & class swap access
              </div>
            </div>
          </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 rounded-xl p-3.5 border border-red-100 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
              <span className="text-lg flex-shrink-0">⚠️</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="text-xs font-medium text-text-light mb-1.5 block">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., Alex Rivera"
              className="input-field"
              autoFocus
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-medium text-text-light mb-1.5 block">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="input-field"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-medium text-text-light mb-1.5 block">
              Password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              className="input-field"
              minLength={6}
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-medium text-text-light mb-1.5 block">
              Confirm Password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              className="input-field"
              required
            />
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Zip Code */}
          <div>
            <label className="text-xs font-medium text-text-light mb-1.5 block">
              Zip Code (Austin area) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="zip"
              value={form.zip}
              onChange={handleChange}
              placeholder="e.g., 78701"
              className="input-field"
              maxLength={5}
              pattern="[0-9]{5}"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`btn-primary w-full text-sm inline-flex items-center justify-center gap-2 ${
              loading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>

          {/* Login link */}
          <p className="text-center text-xs text-text-light mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign In
            </Link>
          </p>

          {/* Trust signal */}
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-xs text-text-light">
              🔒 By creating an account, you agree to our{' '}
              <Link to="#" className="text-primary underline">Terms</Link> and{' '}
              <Link to="#" className="text-primary underline">Privacy Policy</Link>.
            </p>
          </div>
        </form>
        </>
      )}
    </div>
  );
}
