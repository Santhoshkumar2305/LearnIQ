import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import { LayoutDashboard, BookOpen, UserCheck, Settings, Users, BarChart3 } from 'lucide-react';
import './MainLayout.css';

const MainLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  const getSidebarLinks = () => {
    const baseLinks = [
      { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    ];

    if (user?.role === 'admin') {
      return [
        ...baseLinks,
        { path: '/admin/approvals', label: 'Teacher Approvals', icon: <UserCheck size={20} /> },
        { path: '/admin/users', label: 'Manage Users', icon: <Users size={20} /> },
        { path: '/analytics', label: 'System Analytics', icon: <BarChart3 size={20} /> },
      ];
    }

    if (user?.role === 'teacher') {
      return [
        ...baseLinks,
        { path: '/teacher/courses', label: 'My Courses', icon: <BookOpen size={20} /> },
        { path: '/analytics', label: 'Course Analytics', icon: <BarChart3 size={20} /> },
      ];
    }

    if (user?.role === 'student') {
      return [
        ...baseLinks,
        { path: '/student/courses', label: 'Enrolled Courses', icon: <BookOpen size={20} /> },
        { path: '/analytics', label: 'My Progress', icon: <BarChart3 size={20} /> },
      ];
    }

    return baseLinks;
  };

  const links = getSidebarLinks();

  return (
    <div className="main-layout-container">
      <Navbar />
      <div className="layout-content-grid">
        {/* Sidebar */}
        <aside className="layout-sidebar glass-panel">
          <ul className="sidebar-menu">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="link-icon">{link.icon}</span>
                    <span className="link-label">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          
          <div className="sidebar-footer">
            <span className="sidebar-footer-text">SLMS v1.0.0</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="layout-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
