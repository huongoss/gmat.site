import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';
import useAuth from '../hooks/useAuth';

const Navbar: React.FC = () => {
    const { isAuthenticated, user, justLoggedIn, clearJustLoggedIn } = useAuth() as any;
    
    // Clear the justLoggedIn flag after animation completes
    useEffect(() => {
        if (justLoggedIn) {
            const timer = setTimeout(() => {
                clearJustLoggedIn();
            }, 4500); // Animation runs for 1.5s * 3 iterations = 4.5s
            return () => clearTimeout(timer);
        }
    }, [justLoggedIn, clearJustLoggedIn]);
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
                        <NavLink to="/blog" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>Blog</NavLink>
                    </li>
                    <li>
                        <NavLink to="/pricing" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>Pricing</NavLink>
                    </li>
                    {isAuthenticated ? (
                        <>
                            <li>
                                <NavLink 
                                    to="/daily" 
                                    className={({ isActive }) => 
                                        `nav-link${isActive ? ' nav-link--active' : ''}${justLoggedIn ? ' nav-link--daily-highlight' : ''}`
                                    }
                                >
                                    Daily
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/review" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>Review</NavLink>
                            </li>
                            <li>
                                <NavLink to="/account" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>Account</NavLink>
                            </li>
                            {user?.admin && (
                                <li>
                                    <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>Admin</NavLink>
                                </li>
                            )}
                        </>
                    ) : (
                        <>
                            <li>
                                <NavLink to="/login" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>Login</NavLink>
                            </li>
                            <li>
                                <NavLink to="/register" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>Sign up</NavLink>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;