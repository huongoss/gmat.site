import React from 'react';

const NotFound: React.FC = () => {
  return (
    <div className="content-narrow" style={{ padding: '2rem 0' }}>
      <h1 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>Page Not Found</h1>
      <p>The page you requested does not exist or has moved.</p>
      <p style={{ marginTop: '1rem' }}>
        <a href="/" className="btn-outline">Return Home</a>
      </p>
    </div>
  );
};

export default NotFound;
