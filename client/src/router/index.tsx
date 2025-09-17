import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Test from '../pages/Test';
import Review from '../pages/Review';
import Account from '../pages/Account';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Pricing from '../pages/Pricing';
import DailyPractice from '../pages/DailyPractice';

const AppRouter: React.FC = () => {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/test" element={<Test />} />
                <Route path="/review" element={<Review />} />
                <Route path="/account" element={<Account />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/daily" element={<DailyPractice />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
            </Routes>
            <Footer />
        </Router>
    );
};

export default AppRouter;