import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Discover from './pages/Discover';
import Concierge from './pages/Concierge';
import Circle from './pages/Circle';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Partner from './pages/Partner';
import SwapMarketplace from './pages/SwapMarketplace';
import VerificationPortal from './pages/VerificationPortal';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import ReferralStats from './pages/ReferralStats';
import SummerPlanner from './pages/SummerPlanner';
import BottomNav from './components/BottomNav';

function App() {
  return (
    <div className="app">
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/providers" element={<Discover />} />
          <Route path="/concierge" element={<Concierge />} />
          <Route path="/circle" element={<Circle />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/partner" element={<Partner />} />
          <Route path="/swap-marketplace" element={<SwapMarketplace />} />
          <Route path="/verification" element={<VerificationPortal />} />
          <Route path="/analytics-dashboard" element={<AnalyticsDashboard />} />
          <Route path="/referral-stats" element={<ReferralStats />} />
          <Route path="/summer-planner" element={<SummerPlanner />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

export default App;