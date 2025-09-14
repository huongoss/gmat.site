import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import { trackEvent } from '../utils/analytics';

const Home: React.FC = () => {
    return (
        <div className="home">
            <header className="home-hero card">
                <h1>Welcome to GMAT Practice App</h1>
                <p>Your journey to acing the GMAT starts here. Practice with our extensive question bank and track your progress.</p>
                <div className="hero-actions">
                    <Link
                      to="/test"
                      className="btn"
                      onClick={() => trackEvent('cta_click', { location: 'home_hero', cta: 'start_trial' })}
                    >
                      Start Trial Test
                    </Link>
                    <Link
                      to="/account"
                      className="btn-outline"
                      onClick={() => trackEvent('cta_click', { location: 'home_hero', cta: 'manage_account' })}
                    >
                      Manage Account
                    </Link>
                </div>
            </header>

            <section className="home-section card">
                <h2>Why Choose Us?</h2>
                <ul className="bullet-list">
                    <li>Wide range of high-quality, AI-generated GMAT questions.</li>
                    <li>Track performance and review detailed answer explanations.</li>
                    <li>Motivational feedback to keep you on track.</li>
                </ul>
                <p className="mt-3">Try our trial test with 10 questions for free. Subscribe for just $10/month to unlock unlimited practice.</p>
                <Link
                  to="/register"
                  className="btn mt-3"
                  onClick={() => trackEvent('cta_click', { location: 'home_why', cta: 'register_now' })}
                >
                  Register Now
                </Link>
            </section>

            <footer className="home-footer">
                <p>Join thousands of learners and take the first step towards your GMAT success.</p>
            </footer>
        </div>
    );
};

export default Home;