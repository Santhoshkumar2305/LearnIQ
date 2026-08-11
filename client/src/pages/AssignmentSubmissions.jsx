import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, Calendar, Award, 
  CheckCircle, AlertCircle, Clock, ExternalLink, HelpCircle
} from 'lucide-react';
import courseService from '../services/courseService';
import submissionService from '../services/submissionService';
import './AssignmentSubmissions.css';

const AssignmentSubmissions = () => {
  const { id: courseId, assignmentId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [courseId, assignmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch course details (to get enrolled students)
      const courseRes = await courseService.getCourseDetails(courseId);
      if (!courseRes.success) {
        throw new Error(courseRes.message || 'Failed to fetch course details');
      }
      setCourse(courseRes.data);

      // Find the specific assignment
      const currentAssign = courseRes.data.assignments?.find(a => a._id === assignmentId);
      if (!currentAssign) {
        throw new Error('Assignment not found in this course');
      }
      setAssignment(currentAssign);

      // Fetch student submissions for this assignment
      const subRes = await submissionService.getAssignmentSubmissions(assignmentId);
      if (subRes.success) {
        setSubmissions(subRes.data);
      } else {
        throw new Error(subRes.message || 'Failed to load submissions');
      }

    } catch (err) {
      console.error(err);
      setError(err.message || 'Error fetching assignment submissions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="detail-loading-wrapper">
        <div className="loading-spinner"></div>
        <p>Loading submissions workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-error-wrapper animate-fade-in">
        <AlertCircle size={40} className="error-icon" />
        <h2>Error Loading Submissions</h2>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate(`/teacher/courses/${courseId}`)}>
          <ArrowLeft size={16} /> Back to Course
        </button>
      </div>
    );
  }

  // Calculate statistics
  const totalStudents = course.students?.length || 0;
  const submissionsCount = submissions.length;
  const gradedCount = submissions.filter(s => s.status === 'graded').length;
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const reviewedCount = submissions.filter(s => s.status === 'reviewed').length;
  const notSubmittedCount = Math.max(0, totalStudents - submissionsCount);

  // Map student list to include their submission detail
  const studentSubmissions = (course.students || []).map(student => {
    const sub = submissions.find(s => s.student?._id === student._id);
    return {
      student,
      submission: sub || null
    };
  });

  return (
    <div className="submissions-dashboard animate-fade-in">
      {/* Back Header */}
      <div className="dashboard-back-header">
        <button className="btn btn-secondary" onClick={() => navigate(`/teacher/courses/${courseId}`)}>
          <ArrowLeft size={16} /> Back to Course Dashboard
        </button>
        <span className="badge badge-teacher">{course.title}</span>
      </div>

      {/* Assignment Header Banner */}
      <div className="assignment-details-banner glass-panel">
        <div className="banner-details">
          <h1>{assignment.title}</h1>
          <p className="banner-desc">{assignment.description}</p>
          <div className="banner-meta">
            <span className="meta-item"><Calendar size={14} /> Due: {new Date(assignment.dueDate).toLocaleString()}</span>
            <span className="meta-item"><Award size={14} /> Maximum Score: {assignment.maxPoints} points</span>
            {assignment.fileUrl && (
              <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer" className="meta-link">
                View Attached Template <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Summary Statistics Grid */}
      <div className="stats-dashboard-grid">
        <div className="stat-card glass-panel">
          <span className="stat-value">{totalStudents}</span>
          <span className="stat-label">Enrolled Students</span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-value status-graded-text">{gradedCount}</span>
          <span className="stat-label">Graded Submissions</span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-value status-reviewed-text">{reviewedCount}</span>
          <span className="stat-label">AI Evaluated</span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-value status-pending-text">{pendingCount}</span>
          <span className="stat-label">Awaiting Review</span>
        </div>
      </div>

      {/* Submissions List Section */}
      <div className="submissions-list-section glass-panel">
        <div className="section-header">
          <h2>Student Grading Sheets</h2>
          <span className="total-badge">{studentSubmissions.length} records</span>
        </div>

        {studentSubmissions.length === 0 ? (
          <div className="empty-sub-panel text-center">
            <HelpCircle size={40} className="text-muted" />
            <p>No students are currently enrolled in this course.</p>
          </div>
        ) : (
          <div className="submissions-table-wrapper">
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Submitted Date</th>
                  <th>Status</th>
                  <th>Grade</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentSubmissions.map(({ student, submission }) => {
                  let statusClass = 'status-badge status-unsubmitted';
                  let statusText = 'Not Submitted';
                  
                  if (submission) {
                    if (submission.status === 'graded') {
                      statusClass = 'status-badge status-graded';
                      statusText = 'Graded';
                    } else if (submission.status === 'reviewed') {
                      statusClass = 'status-badge status-reviewed';
                      statusText = 'AI Reviewed';
                    } else {
                      statusClass = 'status-badge status-pending';
                      statusText = 'Pending Review';
                    }
                  }

                  return (
                    <tr key={student._id} className="student-row">
                      <td>
                        <div className="student-info-cell">
                          <div className="student-avatar">
                            {student.avatar ? (
                              <img src={student.avatar} alt={student.name} />
                            ) : (
                              <span className="avatar-placeholder">{student.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="student-name">{student.name}</div>
                            <div className="student-email">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {submission ? (
                          <div className="submitted-date-cell">
                            <Clock size={12} />
                            <span>{new Date(submission.submittedAt).toLocaleDateString()} at {new Date(submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ) : (
                          <span className="unsubmitted-text">—</span>
                        )}
                      </td>
                      <td>
                        <span className={statusClass}>{statusText}</span>
                      </td>
                      <td>
                        {submission && submission.status === 'graded' ? (
                          <span className="grade-display graded-score">{submission.grade} <span className="max-points-text">/ {assignment.maxPoints}</span></span>
                        ) : (
                          <span className="grade-display unassigned-score">— <span className="max-points-text">/ {assignment.maxPoints}</span></span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {submission ? (
                          <button 
                            className="btn btn-primary action-review-btn" 
                            onClick={() => navigate(`/teacher/submissions/${submission._id}/review`)}
                          >
                            Review & Grade
                          </button>
                        ) : (
                          <button className="btn btn-secondary action-review-btn" disabled>
                            No Submission
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentSubmissions;
