import React from 'react';
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
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import BlogList from './pages/BlogList';
import BlogPost from './pages/BlogPost';
import { RequireAuth, GuestOnly } from './router/guards';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
// Analytics handled by static gtag snippet in index.html
import './styles/index.css';
import { HelmetProvider } from 'react-helmet-async';

const App: React.FC = () => {
    return (
        <HelmetProvider>
            <Router>
                <div className="app-container">
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/faq" element={<FAQ />} />
                        <Route path="/pricing" element={<Pricing />} />
                        <Route path="/blog" element={<BlogList />} />
                        <Route path="/blog/:slug" element={<BlogPost />} />
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
                        <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                    <Footer />
                </div>
            </Router>
        </HelmetProvider>
    );
};

export default App;