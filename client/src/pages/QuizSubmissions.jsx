import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Award, CheckCircle, 
  AlertCircle, Clock, HelpCircle, Eye, X, Check
} from 'lucide-react';
import courseService from '../services/courseService';
import './QuizSubmissions.css';

const QuizSubmissions = () => {
  const { id: courseId, quizId } = useParams();
  const navigate = useNavigate();

  // Component States
  const [course, setCourse] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State for viewing individual student responses
  const [selectedStudentSub, setSelectedStudentSub] = useState(null);

  useEffect(() => {
    fetchData();
  }, [courseId, quizId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch course details (primarily for the enrolled students list)
      const courseRes = await courseService.getCourseDetails(courseId);
      if (!courseRes.success) {
        throw new Error(courseRes.message || 'Failed to fetch course details');
      }
      setCourse(courseRes.data);

      // Fetch quiz submissions & quiz details
      const subRes = await courseService.getTeacherQuizSubmissions(courseId, quizId);
      if (subRes.success) {
        setSubmissions(subRes.data.submissions || []);
        // Find the quiz structure from the course or use the one returned from the backend
        const currentQuiz = courseRes.data.quizzes?.find(q => q._id === quizId) || {
          title: subRes.data.quizTitle || 'Quiz Details',
          questions: subRes.data.questions || []
        };
        setQuiz(currentQuiz);
      } else {
        throw new Error(subRes.message || 'Failed to load quiz submissions');
      }

    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading quiz details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="detail-loading-wrapper">
        <div className="loading-spinner"></div>
        <p>Loading quiz submission records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-error-wrapper animate-fade-in">
        <AlertCircle size={40} className="error-icon" />
        <h2>Error Loading Quiz Details</h2>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate(`/teacher/courses/${courseId}`)}>
          <ArrowLeft size={16} /> Back to Course
        </button>
      </div>
    );
  }

  const totalQuestions = quiz?.questions?.length || 0;
  const enrolledStudentsCount = course?.students?.length || 0;
  const submissionsCount = submissions.length;
  
  // Calculate average, high, and low scores
  let averageScore = 0;
  let averagePercentage = 0;
  let highScore = 0;
  let lowScore = totalQuestions;

  if (submissionsCount > 0) {
    const totalScores = submissions.reduce((sum, s) => sum + s.score, 0);
    averageScore = (totalScores / submissionsCount).toFixed(1);
    averagePercentage = Math.round((averageScore / totalQuestions) * 100);

    const scoresList = submissions.map(s => s.score);
    highScore = Math.max(...scoresList);
    lowScore = Math.min(...scoresList);
  } else {
    lowScore = 0;
  }

  // Combine student list with their submission record
  const studentSubmissions = (course?.students || []).map(student => {
    const sub = submissions.find(s => s.student?._id === student._id);
    return {
      student,
      submission: sub || null
    };
  });

  const handleOpenResponseModal = (student, submission) => {
    setSelectedStudentSub({ student, submission });
  };

  const handleCloseResponseModal = () => {
    setSelectedStudentSub(null);
  };

  return (
    <div className="quiz-submissions-dashboard animate-fade-in">
      {/* Back Navigation Bar */}
      <div className="dashboard-back-header">
        <button className="btn btn-secondary" onClick={() => navigate(`/teacher/courses/${courseId}`)}>
          <ArrowLeft size={16} /> Back to Course Dashboard
        </button>
        <span className="badge badge-teacher">{course?.title}</span>
      </div>

      {/* Quiz Details Banner */}
      <div className="quiz-details-banner glass-panel">
        <div className="banner-details">
          <h1>{quiz?.title}</h1>
          <div className="banner-meta">
            <span className="meta-item"><HelpCircle size={14} /> {totalQuestions} Multiple-Choice Questions</span>
            <span className="meta-item"><Calendar size={14} /> Created: {quiz?.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Statistics Panels Grid */}
      <div className="stats-dashboard-grid">
        <div className="stat-card glass-panel">
          <span className="stat-value">{enrolledStudentsCount}</span>
          <span className="stat-label">Enrolled Students</span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-value status-graded-text">{submissionsCount}</span>
          <span className="stat-label">Submitted Quiz</span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-value status-reviewed-text">
            {submissionsCount > 0 ? `${averageScore} / ${totalQuestions}` : '—'}
          </span>
          <span className="stat-label">Avg. Score ({averagePercentage}%)</span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-value status-high-text">
            {submissionsCount > 0 ? `${highScore} / ${totalQuestions}` : '—'}
          </span>
          <span className="stat-label">Highest Score</span>
        </div>
      </div>

      {/* Student List Section */}
      <div className="submissions-list-section glass-panel">
        <div className="section-header">
          <h2>Student Response Directory</h2>
          <span className="total-badge">{studentSubmissions.length} Students</span>
        </div>

        {studentSubmissions.length === 0 ? (
          <div className="empty-sub-panel text-center">
            <HelpCircle size={40} className="text-muted" />
            <p>No students enrolled in this course yet.</p>
          </div>
        ) : (
          <div className="submissions-table-wrapper">
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Submitted Date</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentSubmissions.map(({ student, submission }) => {
                  const hasSubmitted = !!submission;
                  const scorePercentage = hasSubmitted ? submission.percentage : 0;
                  
                  // Score color class
                  let scoreColorClass = 'unassigned-score';
                  if (hasSubmitted) {
                    if (scorePercentage >= 80) scoreColorClass = 'score-high';
                    else if (scorePercentage >= 50) scoreColorClass = 'score-medium';
                    else scoreColorClass = 'score-low';
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
                        {hasSubmitted ? (
                          <div className="submitted-date-cell">
                            <Clock size={12} />
                            <span>
                              {new Date(submission.submittedAt).toLocaleDateString()} at{' '}
                              {new Date(submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="unsubmitted-text">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${hasSubmitted ? 'status-graded' : 'status-unsubmitted'}`}>
                          {hasSubmitted ? 'Submitted' : 'Not Attempted'}
                        </span>
                      </td>
                      <td>
                        {hasSubmitted ? (
                          <span className={`grade-display ${scoreColorClass}`}>
                            {submission.score}{' '}
                            <span className="max-points-text">/ {totalQuestions} ({submission.percentage}%)</span>
                          </span>
                        ) : (
                          <span className="grade-display unassigned-score">
                            — <span className="max-points-text">/ {totalQuestions}</span>
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {hasSubmitted ? (
                          <button 
                            className="btn btn-primary action-review-btn" 
                            onClick={() => handleOpenResponseModal(student, submission)}
                          >
                            <Eye size={14} style={{ marginRight: '6px' }} /> View Responses
                          </button>
                        ) : (
                          <button className="btn btn-secondary action-review-btn" disabled>
                            No Attempt
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

      {/* Answer Sheet Modal Popup */}
      {selectedStudentSub && (
        <div className="modal-overlay animate-fade-in" onClick={handleCloseResponseModal}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <h2>Student Answer Key Review</h2>
                <p className="student-meta-details">
                  Student: <strong>{selectedStudentSub.student.name}</strong> ({selectedStudentSub.student.email})
                </p>
              </div>
              <button className="modal-close-btn" onClick={handleCloseResponseModal}>
                <X size={20} />
              </button>
            </div>

            {/* Score Summary */}
            <div className="modal-score-banner">
              <div className="score-summary-item">
                <span className="score-summary-label">Final Score</span>
                <span className="score-summary-value">
                  {selectedStudentSub.submission.score} / {totalQuestions}
                </span>
              </div>
              <div className="score-summary-item">
                <span className="score-summary-label">Percentage</span>
                <span className="score-summary-value">{selectedStudentSub.submission.percentage}%</span>
              </div>
              <div className="score-summary-item">
                <span className="score-summary-label">Submitted On</span>
                <span className="score-summary-value font-small">
                  {new Date(selectedStudentSub.submission.submittedAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Questions Answer Review */}
            <div className="modal-questions-review-list">
              <h3>Question Sheets</h3>
              {quiz?.questions?.map((q, idx) => {
                const answersMap = selectedStudentSub.submission.answers || {};
                // Handle Map object key lookup (String vs Int)
                const selectedOptIdx = answersMap[idx] !== undefined 
                  ? answersMap[idx] 
                  : answersMap[String(idx)];
                
                const isCorrect = selectedOptIdx === q.correctAnswerIndex;

                return (
                  <div key={q._id || idx} className={`response-question-card ${isCorrect ? 'card-correct' : 'card-incorrect'}`}>
                    <div className="q-card-header">
                      <span className="q-index-badge">Q{idx + 1}</span>
                      <p className="q-text">{q.questionText}</p>
                      <span className={`correct-status-badge ${isCorrect ? 'text-success' : 'text-danger'}`}>
                        {isCorrect ? 'Correct (+1 pt)' : 'Incorrect (0 pts)'}
                      </span>
                    </div>

                    <div className="q-options-container">
                      {q.options.map((opt, optIdx) => {
                        const isStudentSelection = selectedOptIdx === optIdx;
                        const isCorrectAnswer = q.correctAnswerIndex === optIdx;

                        let optClass = 'q-option-row-item';
                        if (isStudentSelection && isCorrect) {
                          optClass += ' option-success'; // Student selected correct answer
                        } else if (isStudentSelection && !isCorrect) {
                          optClass += ' option-danger'; // Student selected incorrect answer
                        } else if (isCorrectAnswer) {
                          optClass += ' option-expected'; // Show correct answer highlight
                        }

                        return (
                          <div key={optIdx} className={optClass}>
                            <span className="option-letter">{String.fromCharCode(65 + optIdx)}.</span>
                            <span className="option-text-val">{opt}</span>
                            
                            {isStudentSelection && isCorrect && (
                              <span className="option-indicator-tag correct-tag">Your Choice <Check size={12} /></span>
                            )}
                            {isStudentSelection && !isCorrect && (
                              <span className="option-indicator-tag wrong-tag">Your Choice &times;</span>
                            )}
                            {!isStudentSelection && isCorrectAnswer && (
                              <span className="option-indicator-tag correct-expected-tag">Correct Answer</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseResponseModal}>
                Close Answer Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizSubmissions;
