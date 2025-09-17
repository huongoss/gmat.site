import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar: React.FC = () => {
    return (
        <nav className="navbar">
            <div className="container">
                <div className="navbar-brand">
                    <NavLink to="/" className="nav-link brand">GMAT Practice</NavLink>
                </div>
                <ul className="navbar-links">
                    <li>
                        <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>Home</NavLink>
                    </li>
                    <li>
                        <NavLink to="/daily" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>Daily</NavLink>
                    </li>
                    <li>
                        <NavLink to="/pricing" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>Pricing</NavLink>
                    </li>
                    <li>
                        <NavLink to="/test" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>Test</NavLink>
                    </li>
                    <li>
                        <NavLink to="/review" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>Review</NavLink>
                    </li>
                    <li>
                        <NavLink to="/account" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>Account</NavLink>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;