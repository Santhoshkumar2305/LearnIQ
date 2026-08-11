import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Sparkles, Award, FileText, CheckCircle, 
  AlertCircle, Clock, ExternalLink, ThumbsUp, ThumbsDown, 
  Lightbulb, ShieldAlert, Maximize2, RefreshCw, Send
} from 'lucide-react';
import submissionService from '../services/submissionService';
import './SubmissionReview.css';

const SubmissionReview = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Right side Tab: 'ai' | 'grade'
  const [activeTab, setActiveTab] = useState('ai');
  
  // AI evaluation trigger state
  const [aiLoading, setAiLoading] = useState(false);
  
  // Manual Grading form states
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeError, setGradeError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchSubmissionData();
  }, [submissionId]);

  const fetchSubmissionData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await submissionService.getSubmissionDetails(submissionId);
      if (res.success) {
        setSubmission(res.data);
        
        // Find matching assignment in course
        const assign = res.data.course?.assignments?.find(a => a._id === res.data.assignmentId);
        setAssignment(assign || null);
        
        // Pre-fill grade and feedback if already graded
        if (res.data.status === 'graded') {
          setGrade(res.data.grade !== undefined ? res.data.grade : '');
          setFeedback(res.data.feedback || '');
        }
      } else {
        setError(res.message || 'Failed to load submission details');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error fetching submission details');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAIReview = async () => {
    try {
      setAiLoading(true);
      setError('');
      const res = await submissionService.triggerAIReview(submissionId);
      if (res.success) {
        setSubmission(res.data);
        setSuccessMsg('AI review insights compiled successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(res.message || 'AI review failed');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error compilation AI review');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    setGradeError('');
    setSuccessMsg('');

    if (grade === '') {
      setGradeError('Please provide a grade');
      return;
    }

    const numericGrade = Number(grade);
    const maxPoints = assignment ? assignment.maxPoints : 100;
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > maxPoints) {
      setGradeError(`Grade must be a number between 0 and ${maxPoints}`);
      return;
    }

    try {
      setSavingGrade(true);
      const res = await submissionService.gradeSubmission(submissionId, numericGrade, feedback);
      if (res.success) {
        setSubmission(res.data);
        setSuccessMsg('Grade and feedback released successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setGradeError(res.message || 'Failed to release grade');
      }
    } catch (err) {
      console.error(err);
      setGradeError(err.response?.data?.message || 'Error releasing grade');
    } finally {
      setSavingGrade(false);
    }
  };

  if (loading) {
    return (
      <div className="detail-loading-wrapper">
        <div className="loading-spinner"></div>
        <p>Loading submission files and parameters...</p>
      </div>
    );
  }

  if (error && !submission) {
    return (
      <div className="course-error-wrapper animate-fade-in">
        <AlertCircle size={40} className="error-icon" />
        <h2>Error Accessing Submission</h2>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  const maxPoints = assignment ? assignment.maxPoints : 100;
  const isPdf = submission.submissionFile.toLowerCase().endsWith('.pdf') || 
                (submission.fileName && submission.fileName.toLowerCase().endsWith('.pdf'));

  // Utility to select color based on AI originality score
  const getOriginalityColorClass = (score) => {
    if (score >= 80) return 'score-green';
    if (score >= 50) return 'score-yellow';
    return 'score-red';
  };

  return (
    <div className="review-workspace animate-fade-in">
      {/* Upper Navigation Header */}
      <div className="review-nav-header">
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate(`/teacher/courses/${submission.course._id}/assignments/${submission.assignmentId}/submissions`)}
        >
          <ArrowLeft size={16} /> Back to Submissions List
        </button>
        
        <div className="student-header-meta">
          <div className="avatar-small">
            {submission.student?.avatar ? (
              <img src={submission.student.avatar} alt={submission.student.name} />
            ) : (
              <span className="avatar-placeholder">{(submission.student?.name || 'S').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h3>Reviewing: {submission.student?.name}</h3>
            <p className="student-subtext">{submission.student?.email}</p>
          </div>
        </div>
      </div>

      {/* Alert Notices */}
      {successMsg && (
        <div className="alert alert-success glass-panel animate-fade-in" style={{ marginBottom: '20px' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {error && (
        <div className="alert alert-error glass-panel animate-fade-in" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Side-by-Side Dual Workspace Panel */}
      <div className="workspace-layout">
        
        {/* LEFT PANEL: Student Submission Viewer */}
        <div className="workspace-left-panel glass-panel">
          <div className="panel-title-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} className="text-accent" />
              <h2>Submitted File Content</h2>
            </div>
            <a 
              href={submission.submissionFile} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-secondary download-btn"
            >
              <Maximize2 size={14} /> View Full Screen
            </a>
          </div>

          <div className="viewer-container">
            {isPdf ? (
              <iframe 
                src={submission.submissionFile} 
                title="Student PDF Submission" 
                className="document-iframe-viewport"
                width="100%"
                height="100%"
              />
            ) : (
              <div className="non-pdf-placeholder">
                <FileText size={64} className="placeholder-file-icon" />
                <h3>Non-PDF Format Submitted</h3>
                <p>This submission is in format: <strong>{submission.fileName ? submission.fileName.split('.').pop().toUpperCase() : 'Unknown'}</strong>.</p>
                <p>Click below to download and read the submission locally.</p>
                <a 
                  href={submission.submissionFile} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ marginTop: '15px' }}
                >
                  Download {submission.fileName || 'Submission Document'}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Evaluation Control (AI Review + Grading) */}
        <div className="workspace-right-panel glass-panel">
          
          {/* Tab Selection Headers */}
          <div className="right-panel-tabs">
            <button 
              className={`tab-header-btn ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai')}
            >
              <Sparkles size={16} /> AI Evaluation
            </button>
            <button 
              className={`tab-header-btn ${activeTab === 'grade' ? 'active' : ''}`}
              onClick={() => setActiveTab('grade')}
            >
              <Award size={16} /> Grading & Feedback
            </button>
          </div>

          {/* Tab Body */}
          <div className="right-panel-body">
            
            {/* TAB 1: AI EVALUATION */}
            {activeTab === 'ai' && (
              <div className="ai-eval-tab-content animate-fade-in">
                {aiLoading ? (
                  <div className="ai-loader-block">
                    <RefreshCw className="loading-spinner-ai" size={40} />
                    <h3>Consulting AI Assistant Evaluator...</h3>
                    <p>Scanning PDF structure, auditing concept alignment, checking originality levels, and generating rubric feedback. Please hold on.</p>
                  </div>
                ) : !submission.aiReview || !submission.aiReview.summary ? (
                  <div className="ai-trigger-placeholder">
                    <Sparkles size={50} className="sparkles-icon-placeholder" />
                    <h2>AI-Assisted Evaluation</h2>
                    <p>Let the built-in LLM scan the PDF, verify rubrics, evaluate originality, and provide grading guidelines to save your time.</p>
                    <button className="btn btn-primary trigger-ai-btn" onClick={handleTriggerAIReview}>
                      <Sparkles size={16} /> Generate AI Review
                    </button>
                  </div>
                ) : (
                  <div className="ai-results-pane">
                    
                    {/* Top Row: Originality & Quick Recalculate */}
                    <div className="ai-results-header-row">
                      <div className="originality-meter-box">
                        <span className="meter-label">AI Originality Estimation</span>
                        <div className={`originality-badge ${getOriginalityColorClass(submission.aiReview.originalityScore)}`}>
                          {submission.aiReview.originalityScore}% Original
                        </div>
                      </div>
                      <button 
                        className="btn-icon-secondary" 
                        onClick={handleTriggerAIReview}
                        title="Re-run AI evaluation"
                      >
                        <RefreshCw size={14} /> Refresh AI
                      </button>
                    </div>

                    {/* Summary Card */}
                    <div className="ai-card summary-card">
                      <h3><FileText size={16} /> Work Summary</h3>
                      <p>"{submission.aiReview.summary}"</p>
                    </div>

                    {/* Strengths & Weaknesses Split Columns */}
                    <div className="ai-split-grid">
                      <div className="ai-card list-card strengths-card">
                        <h3><ThumbsUp size={16} /> Key Strengths</h3>
                        <ul>
                          {submission.aiReview.strengths?.map((str, idx) => (
                            <li key={idx}><CheckCircle size={14} className="text-success" /> {str}</li>
                          )) || <li>No notable strengths highlighted.</li>}
                        </ul>
                      </div>
                      <div className="ai-card list-card weaknesses-card">
                        <h3><ThumbsDown size={16} /> Key Weaknesses</h3>
                        <ul>
                          {submission.aiReview.weaknesses?.map((wk, idx) => (
                            <li key={idx}><AlertCircle size={14} className="text-danger" /> {wk}</li>
                          )) || <li>No notable weaknesses highlighted.</li>}
                        </ul>
                      </div>
                    </div>

                    {/* Missing Concepts Alerts */}
                    <div className="ai-card list-card missing-card">
                      <h3><ShieldAlert size={16} /> Missing / Weak Rubric Concepts</h3>
                      {submission.aiReview.missingConcepts?.length === 0 ? (
                        <p className="no-missing-text"><CheckCircle size={14} /> All requested syllabus rubrics identified in work.</p>
                      ) : (
                        <ul>
                          {submission.aiReview.missingConcepts?.map((mc, idx) => (
                            <li key={idx}><AlertCircle size={14} className="text-warning" /> {mc}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Suggestions Box */}
                    <div className="ai-card suggestions-card">
                      <h3><Lightbulb size={16} /> Rubric Recommendations</h3>
                      <p>{submission.aiReview.suggestions}</p>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MANUAL GRADING & FEEDBACK */}
            {activeTab === 'grade' && (
              <div className="grading-tab-content animate-fade-in">
                <form onSubmit={handleSaveGrade} className="grading-form-layout">
                  <h2>Release Evaluation</h2>
                  <p className="form-sub-instructions">Release the final grades and comments to the student profile. The student will receive an immediate notification portal update.</p>
                  
                  {gradeError && (
                    <div className="alert alert-error glass-panel" style={{ padding: '10px 15px', marginBottom: '20px' }}>
                      <AlertCircle size={16} /> {gradeError}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">
                      <span>Assigned Score</span>
                      <span className="label-right-points">Max Score: {maxPoints} pts</span>
                    </label>
                    <div className="grade-input-wrapper">
                      <input 
                        type="number" 
                        className="form-input grade-number-input"
                        placeholder="e.g. 85"
                        min="0"
                        max={maxPoints}
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        required
                        disabled={savingGrade}
                      />
                      <span className="grade-input-denominator">/ {maxPoints}</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Evaluator Remarks / Comments</label>
                    <textarea 
                      className="form-input form-textarea"
                      placeholder="Write your feedback here... e.g. Great work, but you forgot to discuss the complexity analysis in section 3."
                      rows={8}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      disabled={savingGrade}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary submit-grade-btn"
                    disabled={savingGrade}
                  >
                    {savingGrade ? (
                      <>
                        <RefreshCw className="loading-spinner-btn" size={16} /> Releasing Grade...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Release Grade & Remarks
                      </>
                    )}
                  </button>
                </form>

                {submission.status === 'graded' && (
                  <div className="graded-status-info-box glass-panel animate-fade-in">
                    <div className="info-header">
                      <CheckCircle size={16} className="text-success" />
                      <h4>Submission Graded</h4>
                    </div>
                    <p className="info-body">
                      This homework has been marked and released. 
                      {submission.gradedAt && (
                        <span> Graded on {new Date(submission.gradedAt).toLocaleDateString()} at {new Date(submission.gradedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default SubmissionReview;
