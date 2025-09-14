import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Test from '../pages/Test';
import Review from '../pages/Review';
import Account from '../pages/Account';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AppRouter: React.FC = () => {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/test" element={<Test />} />
                <Route path="/review" element={<Review />} />
                <Route path="/account" element={<Account />} />
            </Routes>
            <Footer />
        </Router>
    );
};

export default AppRouter;