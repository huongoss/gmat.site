import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Test from './pages/Test';
import Review from './pages/Review';
import Account from './pages/Account';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './styles/index.css';
import AnalyticsListener from './components/AnalyticsListener';
import Pricing from './pages/Pricing';
import DailyPractice from './pages/DailyPractice';

const App: React.FC = () => {
    return (
        <Router>
            <div className="app-container">
                <Navbar />
                <AnalyticsListener />
                <main>
                    <div className="container">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/test" element={<Test />} />
                            <Route path="/review" element={<Review />} />
                            <Route path="/account" element={<Account />} />
                            <Route path="/pricing" element={<Pricing />} />
                            <Route path="/daily" element={<DailyPractice />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/verify-email" element={<VerifyEmail />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                        </Routes>
                    </div>
                </main>
                <Footer />
            </div>
        </Router>
    );
};

export default App;