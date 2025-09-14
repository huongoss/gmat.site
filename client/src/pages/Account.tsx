import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Account: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="account-page">
            <h1>Account Management</h1>
            {user ? (
                <div>
                    <h2>Welcome, {user.name || user.username || 'User'}!</h2>
                    <p>Your subscription: {user.subscriptionActive ? 'Active' : 'Inactive'}</p>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            ) : (
                <div>
                    <h2>Please log in to manage your account.</h2>
                    <button onClick={() => navigate('/login')}>Login</button>
                </div>
            )}
        </div>
    );
};

export default Account;