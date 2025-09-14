import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <p>&copy; {new Date().getFullYear()} GMAT Practice App. All rights reserved.</p>
                <p>Subscribe for more practice tests and resources!</p>
                <p className="disclaimer">
                  Disclaimer: This website provides original, AI-generated practice materials designed to help users prepare for the GMAT® exam. While inspired by the format and style of the official test, these materials are independently created and are not endorsed by or affiliated with the Graduate Management Admission Council (GMAC). GMAT® is a registered trademark of GMAC, which does not sponsor or support this product.
                </p>
            </div>
        </footer>
    );
};

export default Footer;