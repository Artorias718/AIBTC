import React from 'react';
import './ComingSoonPage.css';

const ComingSoonPage = () => {
  return (
    <div className="coming-soon-page">
      <div className="coming-container">
        {/* Header */}
        <div className="coming-header">
          <h1>🚧 Coming Soon</h1>
          <p>We’re working hard to bring you something amazing. Stay tuned!</p>
        </div>


        {/* Actions */}
        <div className="coming-actions">
          <button className="coming-btn coming-btn-secondary">Back to Home</button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
