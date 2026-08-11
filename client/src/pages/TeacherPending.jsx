import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { Clock, LogOut } from 'lucide-react';
import './TeacherPending.css';

const TeacherPending = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="pending-container flex-center">
      <div className="pending-card glass-panel animate-fade-in">
        <div className="icon-pulse flex-center">
          <Clock size={40} className="text-warning" />
        </div>
        
        <h2>Approval Pending</h2>
        <p className="pending-welcome">Welcome, Mr./Ms. {user?.name}</p>
        
        <p className="pending-description">
          Your Teacher account has been successfully registered! To maintain platform safety, an Administrator must verify and approve your registration details before you can create courses and upload resources.
        </p>

        <div className="status-badge-container">
          <span className="badge badge-pending">Status: Awaiting Verification</span>
        </div>

        <button onClick={handleLogout} className="btn btn-secondary btn-logout">
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default TeacherPending;
