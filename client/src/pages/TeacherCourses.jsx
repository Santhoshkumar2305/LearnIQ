import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Copy, Trash2, ExternalLink, Users, BookOpen, AlertCircle, Check } from 'lucide-react';
import courseService from '../services/courseService';
import './TeacherCourses.css';

const TeacherCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  
  // Copy to clipboard notification helper state
  const [copiedCode, setCopiedCode] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await courseService.getTeacherCourses();
      if (res.success) {
        setCourses(res.data);
      } else {
        setError(res.message || 'Failed to fetch courses');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error loading courses');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await courseService.createCourse(formData);
      if (res.success) {
        setSuccessMsg('Course created successfully!');
        setFormData({ title: '', description: '' });
        setIsModalOpen(false);
        fetchCourses();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(res.message || 'Failed to create course');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error creating course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async (courseId, e) => {
    e.stopPropagation(); // Avoid triggering card click
    if (!window.confirm('Are you sure you want to delete this course? This action is permanent.')) {
      return;
    }

    try {
      const res = await courseService.deleteCourse(courseId);
      if (res.success) {
        setSuccessMsg('Course deleted successfully');
        fetchCourses();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error deleting course');
    }
  };

  const copyInviteCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  return (
    <div className="teacher-courses-container animate-fade-in">
      {/* Header Section */}
      <div className="courses-header-section">
        <div>
          <h1 className="courses-title">My <span className="gradient-text">Courses</span></h1>
          <p className="courses-subtitle">Manage your syllabus, students, assessments, and curriculum materials.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} /> Create Course
        </button>
      </div>

      {/* Message Notifications */}
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

      {/* Courses Grid */}
      {loading ? (
        <div className="loading-spinner-wrapper">
          <div className="loading-spinner"></div>
          <p>Retrieving your courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-courses-state glass-panel animate-fade-in">
          <BookOpen className="empty-icon" size={60} />
          <h2>No Courses Yet</h2>
          <p>Get started by creating your very first course curriculum. Students can join using a generated invite code.</p>
          <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Create Course Now
          </button>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => (
            <div 
              key={course._id} 
              className="course-card glass-panel glass-panel-hover"
              onClick={() => navigate(`/teacher/courses/${course._id}`)}
            >
              <div className="course-card-header">
                <h3 className="course-card-title">{course.title}</h3>
                <div 
                  className={`invite-code-badge ${copiedCode === course.inviteCode ? 'copied' : ''}`}
                  onClick={(e) => copyInviteCode(course.inviteCode, e)}
                  title="Click to copy invite code"
                >
                  <span className="code-label">Code:</span>
                  <span className="code-val">{course.inviteCode}</span>
                  {copiedCode === course.inviteCode ? <Check size={12} /> : <Copy size={12} />}
                </div>
              </div>

              <p className="course-card-desc">{course.description}</p>

              <div className="course-card-meta">
                <div className="meta-item">
                  <Users size={16} />
                  <span>{course.students?.length || 0} Students</span>
                </div>
                <div className="meta-item">
                  <BookOpen size={16} />
                  <span>{course.materials?.length || 0} Materials</span>
                </div>
              </div>

              <div className="course-card-actions">
                <button 
                  className="btn btn-secondary card-action-btn"
                  onClick={() => navigate(`/teacher/courses/${course._id}`)}
                >
                  Manage <ExternalLink size={14} />
                </button>
                <button 
                  className="btn btn-danger card-action-btn-danger"
                  onClick={(e) => handleDeleteCourse(course._id, e)}
                  title="Delete Course"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="modal-header">
              <h2>Create New Course</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '15px' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleCreateCourse}>
              <div className="form-group">
                <label className="form-label" htmlFor="title">Course Title</label>
                <input 
                  type="text" 
                  id="title"
                  name="title"
                  className="form-input" 
                  placeholder="e.g. Modern Web Development"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">Course Description</label>
                <textarea 
                  id="description"
                  name="description"
                  className="form-input form-textarea" 
                  placeholder="Provide a detailed roadmap, prerequisites, and goals for the class."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  required
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherCourses;
