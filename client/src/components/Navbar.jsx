import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';
import { GraduationCap, LogOut, Bell, User } from 'lucide-react';
import { io } from 'socket.io-client';
import notificationService from '../services/notificationService';
import './Navbar.css';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Fetch initial list of user's persistent notifications
    fetchNotifications();

    // Establish WebSocket Connection using VITE_SOCKET_URL
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      withCredentials: true
    });

    // Register user session with the Socket connection
    socket.emit('register', user.id);

    // Live listener for new notifications pushed from the server
    socket.on('notification', (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      if (res.success) {
        setNotifications(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleToggleNotifications = async () => {
    setShowNotifications(!showNotifications);

    // If opening the dropdown and there are unread notifications, mark them as read
    if (!showNotifications && notifications.some(n => !n.isRead)) {
      try {
        await notificationService.markAllAsRead();
        // Optimistically mark all in state as read
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } catch (err) {
        console.error('Failed to mark notifications read:', err);
      }
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'student': return 'badge-student';
      case 'teacher': return 'badge-teacher';
      case 'admin': return 'badge-admin';
      default: return 'badge-pending';
    }
  };

  return (
    <nav className="app-navbar glass-panel">
      <div className="navbar-left">
        <Link to="/dashboard" className="navbar-logo">
          <GraduationCap size={28} className="logo-icon" />
          <span className="logo-text">SmartLMS</span>
        </Link>
      </div>

      <div className="navbar-right">
        {/* Notifications Icon & Dropdown */}
        <div className="notification-wrapper">
          <button 
            className="navbar-icon-btn" 
            onClick={handleToggleNotifications}
            title="Notifications"
          >
            <Bell size={20} />
            {notifications.some(n => !n.isRead) && <span className="notification-dot"></span>}
          </button>
          
          {showNotifications && (
            <div className="notification-dropdown glass-panel animate-fade-in">
              <div className="dropdown-header">
                <h3>Notifications</h3>
              </div>
              <div className="dropdown-body">
                {notifications.length === 0 ? (
                  <p className="no-notifications">No notifications yet</p>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif._id || notif.id} className="notification-item">
                      <p>{notif.message}</p>
                      <span className="notif-time">
                        {new Date(notif.createdAt || Date.now()).toLocaleDateString()} at{' '}
                        {new Date(notif.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Role Badge */}
        <div className="user-profile-badge">
          <div className="profile-icon">
            <User size={16} />
          </div>
          <div className="profile-details">
            <span className="profile-name">{user?.name}</span>
            <span className={`badge ${getRoleBadgeClass(user?.role)}`}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button onClick={handleLogout} className="btn btn-secondary btn-logout-navbar" title="Sign Out">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
