import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Test from '../pages/Test';
import Review from '../pages/Review';
import Account from '../pages/Account';
import Pricing from '../pages/Pricing';
import DailyPractice from '../pages/DailyPractice';
import About from '../pages/About';
import FAQ from '../pages/FAQ';
import Contact from '../pages/Contact';
import Disclaimer from '../pages/Disclaimer';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { RequireAuth, GuestOnly } from './guards';
import Login from '../pages/Login';
import Register from '../pages/Register';
import VerifyEmail from '../pages/VerifyEmail';

const AppRouter: React.FC = () => {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                {/** Test now requires auth to ensure progress can be tracked & gated */}
                <Route path="/test" element={<RequireAuth><Test /></RequireAuth>} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
                <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
                <Route path="/verify-email" element={<GuestOnly><VerifyEmail /></GuestOnly>} />
                <Route path="/review" element={<RequireAuth><Review /></RequireAuth>} />
                <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
                <Route path="/daily" element={<RequireAuth><DailyPractice /></RequireAuth>} />
                <Route path="/about" element={<About />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/disclaimer" element={<Disclaimer />} />
            </Routes>
            <Footer />
        </Router>
    );
};

export default AppRouter;