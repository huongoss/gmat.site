import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';
import useAuth from '../hooks/useAuth';

const Navbar: React.FC = () => {
    const { isAuthenticated, user } = useAuth() as any;
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
                        <NavLink to="/pricing" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>Pricing</NavLink>
                    </li>
                    {isAuthenticated ? (
                        <>
                            <li>
                                <NavLink to="/daily" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>Daily</NavLink>
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