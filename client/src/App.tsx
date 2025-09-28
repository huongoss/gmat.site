import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// Helper to reduce repetition for lazy page imports
const page = (name: string) => lazy(() => import(`./pages/${name}`));
const Home = page('Home');
const Test = page('Test');
const Review = page('Review');
const Account = page('Account');
const Pricing = page('Pricing');
const DailyPractice = page('DailyPractice');
const About = page('About');
const FAQ = page('FAQ');
const Contact = page('Contact');
const Disclaimer = page('Disclaimer');
const NotFound = page('NotFound');
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
                <Suspense fallback={<div className="content-narrow" style={{ padding: '2rem 0' }}><p>Loading…</p></div>}>
                    <Routes>
                        <Route path="/" element={<Home />} />
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
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>
                <Footer />
            </div>
        </Router>
    );
};

export default App;