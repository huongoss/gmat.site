import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Test from './pages/Test';
import Review from './pages/Review';
import Account from './pages/Account';
import Pricing from './pages/Pricing';
import DailyPractice from './pages/DailyPractice';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './styles/index.css';
import { RequireAuth, GuestOnly } from './router/guards';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';

const App: React.FC = () => {
    return (
        <Router>
            <div className="app-container">
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/test" element={<Test />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
                    <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
                    <Route path="/verify-email" element={<GuestOnly><VerifyEmail /></GuestOnly>} />
                    <Route path="/review" element={<RequireAuth><Review /></RequireAuth>} />
                    <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
                    <Route path="/daily" element={<RequireAuth><DailyPractice /></RequireAuth>} />
                </Routes>
                <Footer />
            </div>
        </Router>
    );
};

export default App;