import React from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="footer">
            <div className="container">
                                <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', fontSize: '.9rem' }}>
                                    <Link to="/about">About</Link>
                                    <Link to="/faq">FAQ</Link>
                                    <Link to="/contact">Contact</Link>
                                    <Link to="/disclaimer">Disclaimer</Link>
                                </nav>
                                <p>&copy; {new Date().getFullYear()} GMAT Practice App. All rights reserved.</p>
                                <p style={{ opacity: 0.9 }}>Consistent daily practice builds real improvement. Explore our <Link to="/pricing">pricing</Link>, try a <Link to="/test">free GMAT question set</Link>, or learn how <Link to="/daily">daily practice</Link> accelerates progress.</p>
                <p className="disclaimer">
                  Disclaimer: This website provides original, AI-generated practice materials designed to help users prepare for the GMAT® exam. While inspired by the format and style of the official test, these materials are independently created and are not endorsed by or affiliated with the Graduate Management Admission Council (GMAC). GMAT® is a registered trademark of GMAC, which does not sponsor or support this product.
                </p>
            </div>
        </footer>
    );
};

export default Footer;