import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Pricing from './pages/Pricing';
import Disclaimer from './pages/Disclaimer';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Test from './pages/Test';
import DailyPractice from './pages/DailyPractice';
import Review from './pages/Review';
import Account from './pages/Account';
import NotFound from './pages/NotFound';
import { RequireAuth, GuestOnly } from './router/guards';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AnalyticsListener from './components/AnalyticsListener';
import { initAnalytics } from './utils/analytics';
import './styles/index.css';

const App: React.FC = () => {
    useEffect(() => {
        // Initialize Google Analytics with the build-time injected ID
        const gaId = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID;
        if (gaId) {
            initAnalytics(gaId);
        }
    }, []);

    return (
        <Router>
            <AnalyticsListener />
            <div className="app-container">
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/disclaimer" element={<Disclaimer />} />
                    <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
                    <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
                    <Route path="/forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />
                    <Route path="/reset-password" element={<GuestOnly><ResetPassword /></GuestOnly>} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    {/* Public trial route: no auth required for 10-question trial */}
                    <Route path="/test" element={<Test />} />
                    <Route path="/daily" element={<RequireAuth><DailyPractice /></RequireAuth>} />
                    <Route path="/review" element={<RequireAuth><Review /></RequireAuth>} />
                    <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
                <Footer />
            </div>
        </Router>
    );
};

export default App;