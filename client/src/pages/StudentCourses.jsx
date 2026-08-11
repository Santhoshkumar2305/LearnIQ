import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, User, Check, AlertCircle, PlayCircle, FileText, ChevronRight } from 'lucide-react';
import courseService from '../services/courseService';
import './StudentCourses.css';

const StudentCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Join Course Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const res = await courseService.getStudentCourses();
      if (res.success) {
        setCourses(res.data);
      } else {
        setError(res.message || 'Failed to fetch enrolled courses');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error loading enrolled courses');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCourse = async (e) => {
    e.preventDefault();
    if (!inviteCode) return;

    try {
      setJoining(true);
      setError('');
      const res = await courseService.joinCourse(inviteCode);
      if (res.success) {
        setSuccessMsg('Successfully joined course!');
        setInviteCode('');
        setIsModalOpen(false);
        fetchEnrolledCourses();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(res.message || 'Failed to join course');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error joining course. Check the invite code.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="student-courses-container animate-fade-in">
      {/* Header Section */}
      <div className="student-header-section">
        <div>
          <h1 className="student-title">My Enrolled <span className="gradient-text">Courses</span></h1>
          <p className="student-subtitle">Access your classrooms, study materials, quizzes, and submit assignments.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} /> Join Course via Code
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="alert alert-success glass-panel">
          <Check size={18} /> {successMsg}
        </div>
      )}
      {error && !isModalOpen && (
        <div className="alert alert-error glass-panel">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Enrolled Courses Grid */}
      {loading ? (
        <div className="loading-spinner-wrapper">
          <div className="loading-spinner"></div>
          <p>Retrieving your enrolled classes...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-student-state glass-panel animate-fade-in">
          <BookOpen className="empty-icon" size={60} />
          <h2>Not Enrolled In Any Courses</h2>
          <p>You have not joined any courses yet. Get the invite code from your teacher and enter it here to join!</p>
          <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Join Course Now
          </button>
        </div>
      ) : (
        <div className="student-courses-grid">
          {courses.map((course) => (
            <div 
              key={course._id} 
              className="student-course-card glass-panel glass-panel-hover"
              onClick={() => navigate(`/student/courses/${course._id}`)}
            >
              <div className="course-card-top">
                <h3 className="course-card-title">{course.title}</h3>
                <p className="teacher-info">
                  <User size={14} />
                  <span>Instructor: {course.teacher?.name}</span>
                </p>
              </div>

              <p className="course-card-desc">{course.description}</p>

              <div className="course-card-metrics">
                <div className="metric-item">
                  <FileText size={16} />
                  <span>{course.materials?.length || 0} Materials</span>
                </div>
                <div className="metric-item">
                  <BookOpen size={16} />
                  <span>{course.quizzes?.length || 0} Quizzes</span>
                </div>
              </div>

              <div className="course-card-footer">
                <span className="enter-text">Go to Classroom</span>
                <ChevronRight size={16} className="arrow-icon" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Join Course Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="modal-header">
              <h2>Join Course via Code</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '15px' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleJoinCourse}>
              <div className="form-group">
                <label className="form-label" htmlFor="inviteCode">Invite Code</label>
                <input 
                  type="text" 
                  id="inviteCode"
                  className="form-input" 
                  placeholder="e.g. AB12CD"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  maxLength={6}
                  required
                />
                <span className="form-tip">Ask your instructor for the 6-character course code.</span>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={joining}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={joining}
                >
                  {joining ? 'Joining...' : 'Join Classroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCourses;
