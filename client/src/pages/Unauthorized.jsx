import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import './Unauthorized.css';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="unauthorized-container flex-center">
      <div className="unauthorized-card glass-panel animate-fade-in">
        <div className="icon-shield flex-center">
          <ShieldAlert size={40} className="text-danger" />
        </div>
        
        <h2>Access Denied</h2>
        <p className="unauthorized-description">
          Oops! You do not have permissions to access this area. If you believe this is an error, please contact your administrator.
        </p>

        <button onClick={() => navigate('/dashboard')} className="btn btn-primary btn-back">
          <ArrowLeft size={18} />
          <span>Go to Dashboard</span>
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
