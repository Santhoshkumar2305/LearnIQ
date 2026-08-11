import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ fullPage = false }) => {
  return (
    <div className={`spinner-container ${fullPage ? 'full-page' : ''}`}>
      <div className="spinner-glow"></div>
      <div className="spinner-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <span className="spinner-text">Loading SLMS...</span>
    </div>
  );
};

export default LoadingSpinner;
