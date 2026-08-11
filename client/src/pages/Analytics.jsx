import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, Users, BookOpen, Award, FileText, CheckCircle, Clock 
} from 'lucide-react';
import analyticsService from '../services/analyticsService';
import './Analytics.css';

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const Analytics = () => {
  const { user } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      let res;
      if (user?.role === 'student') {
        res = await analyticsService.getStudentAnalytics();
      } else if (user?.role === 'teacher') {
        res = await analyticsService.getTeacherAnalytics();
      } else if (user?.role === 'admin') {
        res = await analyticsService.getAdminAnalytics();
      }

      if (res && res.success) {
        setData(res.data);
      } else {
        setError(res?.message || 'Failed to fetch analytics statistics');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error connecting to analytics services');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="detail-loading-wrapper">
        <div className="loading-spinner"></div>
        <p>Assembling metrics dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="course-error-wrapper animate-fade-in">
        <h2>Analytics Temporarily Offline</h2>
        <p>{error || 'No stats data available.'}</p>
        <button className="btn btn-primary" onClick={fetchAnalytics}>
          Retry Connection
        </button>
      </div>
    );
  }

  // --- 1. STUDENT ANALYTICS VIEW ---
  const renderStudentAnalytics = () => {
    const { summary, charts } = data;
    return (
      <div className="analytics-layout animate-fade-in">
        <div className="analytics-header">
          <h1>My Academic <span className="gradient-text">Progress</span></h1>
          <p>Real-time analytics aggregating your coursework, homework, and quiz performance.</p>
        </div>

        {/* Stats Grid */}
        <div className="analytics-stats-grid">
          <div className="stat-card glass-panel">
            <div className="card-icon-wrapper purple-glow"><BookOpen size={20} /></div>
            <span className="stat-value">{summary.coursesEnrolled}</span>
            <span className="stat-label">Enrolled Courses</span>
          </div>
          <div className="stat-card glass-panel">
            <div className="card-icon-wrapper blue-glow"><FileText size={20} /></div>
            <span className="stat-value">{summary.assignmentsSubmitted}</span>
            <span className="stat-label">Assignments Uploaded</span>
          </div>
          <div className="stat-card glass-panel">
            <div className="card-icon-wrapper cyan-glow"><Clock size={20} /></div>
            <span className="stat-value">{summary.quizzesTaken}</span>
            <span className="stat-label">Quizzes Completed</span>
          </div>
          <div className="stat-card glass-panel">
            <div className="card-icon-wrapper green-glow"><Award size={20} /></div>
            <span className="stat-value">{summary.avgAssignmentGrade}%</span>
            <span className="stat-label">Avg. Assignment Score</span>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Assignment performance over time */}
          <div className="chart-card glass-panel">
            <h3>Assignment Performance (%)</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={charts.assignments} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGrade" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="title" stroke="rgba(255, 255, 255, 0.5)" fontSize={12} />
                  <YAxis stroke="rgba(255, 255, 255, 0.5)" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ background: '#11131e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="percentage" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorGrade)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quiz Performance Bar Chart */}
          <div className="chart-card glass-panel">
            <h3>Quiz Scores (%)</h3>
            <div className="chart-wrapper">
              {charts.quizzes.length === 0 ? (
                <div className="empty-chart-msg">Submit quizzes to populate analytics details.</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={charts.quizzes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis dataKey="title" stroke="rgba(255, 255, 255, 0.5)" fontSize={12} />
                    <YAxis stroke="rgba(255, 255, 255, 0.5)" fontSize={12} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ background: '#11131e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="percentage" fill="#06b6d4" radius={[6, 6, 0, 0]}>
                      {charts.quizzes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- 2. TEACHER ANALYTICS VIEW ---
  const renderTeacherAnalytics = () => {
    const { summary, charts } = data;
    return (
      <div className="analytics-layout animate-fade-in">
        <div className="analytics-header">
          <h1>Course <span className="gradient-text">Analytics</span> Dashboard</h1>
          <p>Class metrics overview, average grades, and distribution breakdown.</p>
        </div>

        {/* Stats Grid */}
        <div className="analytics-stats-grid">
          <div className="stat-card glass-panel">
            <div className="card-icon-wrapper purple-glow"><BookOpen size={20} /></div>
            <span className="stat-value">{summary.totalCourses}</span>
            <span className="stat-label">Active Courses</span>
          </div>
          <div className="stat-card glass-panel">
            <div className="card-icon-wrapper blue-glow"><Users size={20} /></div>
            <span className="stat-value">{summary.totalStudents}</span>
            <span className="stat-label">Unique Students</span>
          </div>
          <div className="stat-card glass-panel">
            <div className="card-icon-wrapper cyan-glow"><Clock size={20} /></div>
            <span className="stat-value">{summary.pendingReviews}</span>
            <span className="stat-label">Submissions Awaiting Grading</span>
          </div>
          <div className="stat-card glass-panel">
            <div className="card-icon-wrapper green-glow"><CheckCircle size={20} /></div>
            <span className="stat-value">{summary.gradedSubmissions}</span>
            <span className="stat-label">Submissions Graded</span>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Homework Assignment Class Performance */}
          <div className="chart-card glass-panel">
            <h3>Average Class Assignment Scores (%)</h3>
            <div className="chart-wrapper">
              {charts.classPerformance.length === 0 ? (
                <div className="empty-chart-msg">No assignments graded yet to display performance.</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={charts.classPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis dataKey="assignmentTitle" stroke="rgba(255, 255, 255, 0.5)" fontSize={12} />
                    <YAxis stroke="rgba(255, 255, 255, 0.5)" fontSize={12} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ background: '#11131e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="averagePercentage" fill="#8b5cf6" radius={[6, 6, 0, 0]}>
                      {charts.classPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Student enrollment distribution */}
          <div className="chart-card glass-panel">
            <h3>Course Size Distribution (Students)</h3>
            <div className="chart-wrapper flex-center">
              {charts.courseDistribution.length === 0 ? (
                <div className="empty-chart-msg">Create courses and enroll students to populate stats.</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={charts.courseDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      fill="#8b5cf6"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {charts.courseDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#11131e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- 3. ADMIN ANALYTICS VIEW ---
  const renderAdminAnalytics = () => {
    const { summary, charts } = data;
    return (
      <div className="analytics-layout animate-fade-in">
        <div className="analytics-header">
          <h1>System <span className="gradient-text">Analytics</span> Dashboard</h1>
          <p>Global system summary, role distributions, and platform stats.</p>
        </div>

        {/* Stats Grid */}
        <div className="analytics-stats-grid">
          <div className="stat-card glass-panel">
            <div className="card-icon-wrapper purple-glow"><Users size={20} /></div>
            <span className="stat-value">{summary.totalUsers}</span>
            <span className="stat-label">Platform Accounts</span>
          </div>
          <div className="stat-card glass-panel">
            <div className="card-icon-wrapper blue-glow"><BookOpen size={20} /></div>
            <span className="stat-value">{summary.totalCourses}</span>
            <span className="stat-label">Created Courses</span>
          </div>
          <div className="stat-card glass-panel">
            <div className="card-icon-wrapper cyan-glow"><TrendingUp size={20} /></div>
            <span className="stat-value">{summary.pendingApprovals}</span>
            <span className="stat-label">Pending Instructor Approvals</span>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* User Distribution Donut Chart */}
          <div className="chart-card glass-panel">
            <h3>User Role Distribution</h3>
            <div className="chart-wrapper flex-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={charts.userDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {charts.userDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#11131e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Platform Course Sizes */}
          <div className="chart-card glass-panel">
            <h3>Top Active Course Sizes (Enrolled Students)</h3>
            <div className="chart-wrapper">
              {charts.courseEnrollment.length === 0 ? (
                <div className="empty-chart-msg">No platform courses have been created yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={charts.courseEnrollment}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis dataKey="courseTitle" stroke="rgba(255, 255, 255, 0.5)" fontSize={12} />
                    <YAxis stroke="rgba(255, 255, 255, 0.5)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ background: '#11131e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="studentsCount" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  switch (user?.role) {
    case 'student': return renderStudentAnalytics();
    case 'teacher': return renderTeacherAnalytics();
    case 'admin': return renderAdminAnalytics();
    default:
      return (
        <div className="course-error-wrapper">
          <h2>Access Level Pending</h2>
          <p>Your account role is unrecognized or awaiting admin approval.</p>
        </div>
      );
  }
};

export default Analytics;
