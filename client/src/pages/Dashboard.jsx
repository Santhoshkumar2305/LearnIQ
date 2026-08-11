import React from 'react';
import { useSelector } from 'react-redux';
import { Layout, Users, BookOpen, GraduationCap } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="dashboard-header-block">
        <h1 className="dashboard-title">
          Welcome Back, <span className="gradient-text">{user?.name}</span>!
        </h1>
      </div>

      <div className="dashboard-about-card glass-panel animate-fade-in">
        <h2>About SmartLMS</h2>
        <p className="dashboard-about-desc">
          SmartLMS is a production-ready Learning Management System that bridges course content organization with secure document deliveries, real-time communications, and intelligent grading metrics.
        </p>

        <div className="dashboard-features-row">
          <div className="feature-item">
            <span className="feature-dot primary-dot"></span>
            <div>
              <h4>Course Management</h4>
              <p>Teachers can structure classrooms, distribute resource guides (PDFs/Videos) via Cloudinary integration, and manage student enrollment codes.</p>
            </div>
          </div>

          <div className="feature-item">
            <span className="feature-dot accent-dot"></span>
            <div>
              <h4>Interactive App Flow</h4>
              <p>Students can enroll via invite shortcodes, submit assignment files, participate in secure auto-graded quizzes, and generate AI notes.</p>
            </div>
          </div>

          <div className="feature-item">
            <span className="feature-dot success-dot"></span>
            <div>
              <h4>Academic Insights</h4>
              <p>Visual chart widgets map grade distributions, enrollment metrics, platform aggregates, and real-time live notification listings.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
