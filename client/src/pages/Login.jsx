import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

function Login() {
  return (
    <div className="px-4 pb-32">
      <SEO
        title="Sign In"
        description="Sign in to KidCircle to access personalized enrichment recommendations, camp swaps, and your trusted parent network in Austin."
        url="/login"
      />
      <div className="pt-6 mb-6">
        <h1 className="text-xl font-bold text-text mb-1">Welcome Back</h1>
        <p className="text-xs text-text-light">Sign in to your KidCircle account</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-4">
        <h2 className="text-base font-bold text-text mb-4">Sign In</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-light mb-1.5 block">Email Address</label>
            <input type="email" placeholder="your@email.com" className="input-field" />
          </div>
          <div>
            <label className="text-xs font-medium text-text-light mb-1.5 block">Password</label>
            <input type="password" placeholder="Enter your password" className="input-field" />
          </div>
          <button className="btn-primary w-full text-sm">Sign In</button>
        </div>
      </div>

      <p className="text-center text-xs text-text-light">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary font-semibold hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default Login;