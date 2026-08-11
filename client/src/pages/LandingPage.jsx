import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Users, Shield, Cpu, Bell } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-wrapper">
      {/* Navigation Header */}
      <header className="landing-header glass-panel">
        <div className="logo-section">
          <GraduationCap size={32} className="logo-icon" />
          <span className="logo-text">SmartLMS</span>
        </div>
        <nav className="header-nav">
          <Link to="/login" className="btn btn-secondary btn-login-nav">Sign In</Link>
          <Link to="/signup" className="btn btn-primary btn-signup-nav">Get Started</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content animate-fade-in">
          <div className="hero-badge">
            <Cpu size={14} className="badge-icon" />
            <span>Next-Generation Learning powered by AI</span>
          </div>
          <h1>
            Elevate Your Classrooms with <span className="gradient-text">Smart LMS</span>
          </h1>
          <p className="hero-subtitle">
            A comprehensive, production-ready Learning Management System bridging real-time interaction, secure media deliveries, role-based workflows, and advanced AI-assisted grading insights.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary btn-lg">Create Free Account</Link>
            <Link to="/login" className="btn btn-secondary btn-lg">Explore Courses</Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <h2 className="section-title">Core Platform Architecture</h2>
        <p className="section-subtitle">Stunning features designed specifically for modern higher education and private courses.</p>
        
        <div className="features-grid">
          <div className="feature-card glass-panel glass-panel-hover">
            <div className="feature-icon-wrapper student-color">
              <BookOpen size={24} />
            </div>
            <h3>Active Students</h3>
            <p>Enroll dynamically via secure shortcodes. Consume pdfs, watch cloud-hosted videos, and generate summaries using Groq AI.</p>
          </div>

          <div className="feature-card glass-panel glass-panel-hover">
            <div className="feature-icon-wrapper teacher-color">
              <Users size={24} />
            </div>
            <h3>Empowered Teachers</h3>
            <p>Organize structures, compile quizzes/assignments, upload resources to Cloudinary, and evaluate with AI review assistants.</p>
          </div>

          <div className="feature-card glass-panel glass-panel-hover">
            <div className="feature-icon-wrapper admin-color">
              <Shield size={24} />
            </div>
            <h3>System Admins</h3>
            <p>Vet and approve registering educators, oversee global user registries, monitor courses, and read extensive charts.</p>
          </div>

          <div className="feature-card glass-panel glass-panel-hover">
            <div className="feature-icon-wrapper ai-color">
              <Cpu size={24} />
            </div>
            <h3>Groq AI Assistant</h3>
            <p>Instant PDF summarization for notes, and standard rubric recommendations for assignment evaluations.</p>
          </div>

          <div className="feature-card glass-panel glass-panel-hover">
            <div className="feature-icon-wrapper socket-color">
              <Bell size={24} />
            </div>
            <h3>Real-time WebSockets</h3>
            <p>Receive notifications instantly for new lectures, quizzes, or homework grades. Stores notifications offline.</p>
          </div>

          <div className="feature-card glass-panel glass-panel-hover">
            <div className="feature-icon-wrapper analytics-color">
              <GraduationCap size={24} />
            </div>
            <h3>Unified Analytics</h3>
            <p>Engage with beautiful visual charts tracking grade progressions, enrollments, and platform operations.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} SmartLMS. Built using the MERN Stack. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
