import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, Video, Calendar, Award, 
  HelpCircle, UploadCloud, CheckCircle, AlertCircle, 
  ExternalLink, Eye, Clipboard, BookOpen, User, PlayCircle, Clock
} from 'lucide-react';
import courseService from '../services/courseService';
import submissionService from '../services/submissionService';
import './StudentCourseDetail.css';

const StudentCourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State variables
  const [course, setCourse] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [quizSubmissions, setQuizSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Navigation tab
  const [activeTab, setActiveTab] = useState('materials');

  // Media preview state
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  
  // AI Notes state
  const [aiNotes, setAiNotes] = useState({}); // materialId -> notes content
  const [generatingNotes, setGeneratingNotes] = useState(false);

  // Homework submission upload state
  const [submittingFileId, setSubmittingFileId] = useState(null); // assignmentId
  const [homeworkFile, setHomeworkFile] = useState(null);
  const [uploadingHomework, setUploadingHomework] = useState(false);

  // Interactive Quiz state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // questionIndex -> optionIndex
  const [quizResult, setQuizResult] = useState(null); // { score, total, percentage }

  useEffect(() => {
    fetchCourseAndSubmissions();
  }, [id]);

  const fetchCourseAndSubmissions = async () => {
    try {
      setLoading(true);
      const courseRes = await courseService.getCourseDetails(id);
      if (courseRes.success) {
        setCourse(courseRes.data);
      } else {
        setError(courseRes.message || 'Failed to load course');
        return;
      }

      // Fetch student submissions
      const subRes = await submissionService.getCourseSubmissions(id);
      if (subRes.success) {
        setSubmissions(subRes.data);
      }

      // Fetch student quiz submissions
      const quizSubRes = await courseService.getQuizSubmissions(id);
      if (quizSubRes.success) {
        setQuizSubmissions(quizSubRes.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error loading course information');
    } finally {
      setLoading(false);
    }
  };

  // --- AI Notes generation ---
  const handleGenerateNotes = async (materialId) => {
    try {
      setGeneratingNotes(true);
      setError('');
      const res = await courseService.generateNotes(id, materialId);
      if (res.success && res.data?.notes) {
        setAiNotes(prev => ({ ...prev, [materialId]: res.data.notes }));
        setSuccessMsg('AI Study Notes generated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(res.message || 'Failed to generate study notes');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error communicating with AI server');
    } finally {
      setGeneratingNotes(false);
    }
  };

  // --- Homework Upload Handlers ---
  const handleHomeworkFileChange = (e, assignId) => {
    if (e.target.files && e.target.files[0]) {
      setHomeworkFile(e.target.files[0]);
      setSubmittingFileId(assignId);
    }
  };

  const handleUploadHomework = async (e, assignId) => {
    e.preventDefault();
    if (!homeworkFile) {
      alert('Please choose a file to submit');
      return;
    }

    try {
      setUploadingHomework(true);
      setError('');
      const formData = new FormData();
      formData.append('file', homeworkFile);

      const res = await submissionService.submitAssignment(id, assignId, formData);
      if (res.success) {
        setSuccessMsg('Homework submitted successfully!');
        setHomeworkFile(null);
        setSubmittingFileId(null);
        // Refresh submissions
        const subRes = await submissionService.getCourseSubmissions(id);
        if (subRes.success) {
          setSubmissions(subRes.data);
        }
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed uploading assignment submission.');
    } finally {
      setUploadingHomework(false);
    }
  };

  // --- Quiz Handlers ---
  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizResult(null);
  };

  const handleSelectAnswer = (optionIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionIndex
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitQuiz = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await courseService.submitQuiz(id, activeQuiz._id, selectedAnswers);
      if (res.success) {
        setQuizResult({
          score: res.data.score,
          total: res.data.totalQuestions,
          percentage: res.data.percentage
        });
        setQuizSubmissions(prev => [...prev, res.data]);
        setSuccessMsg('Quiz submitted and graded successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error submitting quiz answers');
    } finally {
      setLoading(false);
    }
  };

  const showCompletedQuizSummary = (quiz, sub) => {
    setActiveQuiz(quiz);
    // Answers are stored as Map / Object on backend, so we pass it directly
    setSelectedAnswers(sub.answers || {});
    setQuizResult({
      score: sub.score,
      total: sub.totalQuestions,
      percentage: sub.percentage
    });
  };

  // Helper to parse double asterisks and lists into simple JSX notes rendering
  const renderMarkdownNotes = (markdownText) => {
    if (!markdownText) return null;
    
    // Split lines
    const lines = markdownText.split('\n');
    return lines.map((line, idx) => {
      let content = line;
      
      // Parse Bold
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      const renderedLine = parts.length > 0 ? parts : content;

      // Parse Headers
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="notes-h1">{renderedLine.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="notes-h2">{renderedLine.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="notes-h3">{renderedLine.slice(4)}</h3>;
      }

      // Parse Bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={idx} className="notes-li">{renderedLine.slice(2)}</li>;
      }

      return line.trim() === '' ? <br key={idx} /> : <p key={idx} className="notes-p">{renderedLine}</p>;
    });
  };

  if (loading) {
    return (
      <div className="detail-loading-wrapper">
        <div className="loading-spinner"></div>
        <p>Entering classroom workspace...</p>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="course-error-wrapper animate-fade-in">
        <AlertCircle size={40} className="error-icon" />
        <h2>Access Denied / Error</h2>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/student/courses')}>
          <ArrowLeft size={16} /> Back to Enrolled Courses
        </button>
      </div>
    );
  }

  return (
    <div className="student-detail-container animate-fade-in">
      
      {/* Quiz Overlay portal */}
      {activeQuiz && (
        <div className="quiz-overlay-backdrop">
          <div className="quiz-overlay-card glass-panel animate-fade-in">
            <div className="quiz-overlay-header">
              <h2>{activeQuiz.title}</h2>
              {!quizResult && (
                <span className="quiz-question-counter">
                  Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
                </span>
              )}
              <button className="modal-close" onClick={() => setActiveQuiz(null)}>&times;</button>
            </div>

            {!quizResult ? (
              <div className="quiz-active-body">
                {/* Question */}
                <h3 className="quiz-question-text">
                  {activeQuiz.questions[currentQuestionIndex].questionText}
                </h3>

                {/* Options list */}
                <div className="quiz-options-list">
                  {activeQuiz.questions[currentQuestionIndex].options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;
                    return (
                      <div 
                        key={optIdx}
                        className={`quiz-option-card glass-panel ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectAnswer(optIdx)}
                      >
                        <span className="option-index-letter">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <p>{opt}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="quiz-progress-bar-wrapper">
                  <div 
                    className="quiz-progress-bar" 
                    style={{ width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%` }}
                  ></div>
                </div>

                {/* Navigation actions */}
                <div className="quiz-nav-row">
                  <button 
                    className="btn btn-secondary" 
                    onClick={prevQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </button>

                  {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                    <button 
                      className="btn btn-primary" 
                      onClick={nextQuestion}
                      disabled={selectedAnswers[currentQuestionIndex] === undefined}
                    >
                      Next Question
                    </button>
                  ) : (
                    <button 
                      className="btn btn-accent" 
                      onClick={submitQuiz}
                      disabled={selectedAnswers[currentQuestionIndex] === undefined}
                    >
                      Submit Answers
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="quiz-result-body text-center animate-fade-in">
                <Award size={60} className="result-icon-glow" />
                <h2>Quiz Completed!</h2>
                <div className="result-score-block">
                  <span className="result-percentage gradient-text">{quizResult.percentage}%</span>
                  <p>You scored <strong>{quizResult.score}</strong> correct out of <strong>{quizResult.total}</strong> questions.</p>
                </div>

                <div className="result-answers-breakdown">
                  {activeQuiz.questions.map((q, idx) => {
                    const studentAns = selectedAnswers[idx];
                    const correctAns = q.correctAnswerIndex;
                    const isCorrect = studentAns === correctAns;

                    return (
                      <div key={idx} className={`result-question-row ${isCorrect ? 'correct' : 'incorrect'}`}>
                        <p className="res-q-title">Q{idx + 1}: {q.questionText}</p>
                        <p className="res-q-ans">
                          Your choice: <strong>{q.options[studentAns]}</strong> 
                          {!isCorrect && (
                            <span> | Correct: <strong>{q.options[correctAns]}</strong></span>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <button className="btn btn-primary" onClick={() => setActiveQuiz(null)}>
                  Back to Classroom
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Classroom layout */}
      <div className="detail-header-nav">
        <button className="back-link btn btn-secondary" onClick={() => navigate('/student/courses')}>
          <ArrowLeft size={16} /> Classrooms
        </button>
        <span className="badge badge-student">Student Classroom</span>
      </div>

      <div className="course-header-banner glass-panel">
        <div className="banner-primary-info">
          <h1 className="banner-title">{course.title}</h1>
          <p className="banner-desc">{course.description}</p>
          <div className="teacher-badge-banner" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={16} className="text-muted" />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Teacher: <strong>{course.teacher?.name}</strong> ({course.teacher?.email})
            </span>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success glass-panel">
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}
      {error && (
        <div className="alert alert-error glass-panel">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Classroom Tabs */}
      <div className="detail-tabs-bar">
        <button 
          className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('materials');
            setSelectedMaterial(null);
          }}
        >
          <FileText size={18} /> Course Materials ({course.materials?.length || 0})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          <Calendar size={18} /> Assignments ({course.assignments?.length || 0})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quizzes')}
        >
          <HelpCircle size={18} /> Quizzes ({course.quizzes?.length || 0})
        </button>
      </div>

      <div className="tab-content-panel">
        
        {/* TAB 1: MATERIALS */}
        {activeTab === 'materials' && (
          <div className="panel-tab-body animate-fade-in">
            {selectedMaterial ? (
              // Splitscreen layout: Viewer left, AI Notes right
              <div className="materials-splitscreen">
                
                {/* Left Side: Media Viewer */}
                <div className="media-viewer-side glass-panel">
                  <div className="viewer-header">
                    <h3>{selectedMaterial.title}</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a 
                        href={selectedMaterial.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-secondary btn-small"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        View Full Screen <ExternalLink size={14} />
                      </a>
                      <button className="btn btn-secondary btn-small" onClick={() => setSelectedMaterial(null)}>
                        Close Viewer
                      </button>
                    </div>
                  </div>

                  <div className="viewer-body">
                    {selectedMaterial.type === 'video' ? (
                      <video 
                        src={selectedMaterial.url} 
                        controls 
                        className="video-player-component"
                        controlsList="nodownload"
                      ></video>
                    ) : (
                      <iframe 
                        src={`${selectedMaterial.url}#toolbar=0`}
                        title="PDF Lecture Viewer"
                        className="pdf-iframe-component"
                      ></iframe>
                    )}
                  </div>
                </div>

                {/* Right Side: AI Companion Notes */}
                <div className="ai-notes-side glass-panel">
                  <div className="ai-notes-header">
                    <h3>AI study notes</h3>
                    <span className="badge badge-teacher">Groq Powered</span>
                  </div>

                  <div className="ai-notes-body">
                    {aiNotes[selectedMaterial._id] ? (
                      <div className="ai-markdown-notes-wrapper animate-fade-in">
                        {renderMarkdownNotes(aiNotes[selectedMaterial._id])}
                      </div>
                    ) : (
                      <div className="ai-notes-empty-state text-center">
                        <BookOpen size={40} className="text-muted" style={{ marginBottom: '15px' }} />
                        <h4>Need study sheets?</h4>
                        <p>Let AI parse this lecture material and synthesize organized study concepts for you.</p>
                        
                        <button 
                          className="btn btn-primary" 
                          onClick={() => handleGenerateNotes(selectedMaterial._id)}
                          disabled={generatingNotes}
                          style={{ marginTop: '20px' }}
                        >
                          {generatingNotes ? 'Parsing & Summarizing PDF...' : 'Generate AI Study Notes'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              // Default Materials listing
              <div>
                <h2>Materials & Resources</h2>
                {course.materials?.length === 0 ? (
                  <div className="empty-sub-panel glass-panel text-center" style={{ marginTop: '20px' }}>
                    <FileText size={40} className="text-muted" />
                    <p>No course curriculum materials uploaded yet by the teacher.</p>
                  </div>
                ) : (
                  <div className="materials-list" style={{ marginTop: '20px' }}>
                    {course.materials.map((mat) => (
                      <div key={mat._id} className="material-item-row glass-panel glass-panel-hover">
                        <div className="mat-icon-and-title">
                          {mat.type === 'video' ? (
                            <div className="mat-icon video-icon"><Video size={20} /></div>
                          ) : (
                            <div className="mat-icon pdf-icon"><FileText size={20} /></div>
                          )}
                          <div>
                            <h4>{mat.title}</h4>
                            <span className="mat-date">{new Date(mat.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button 
                          className="btn btn-primary view-mat-btn"
                          onClick={() => setSelectedMaterial(mat)}
                        >
                          Open Classroom Viewer <Eye size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <div className="panel-tab-body animate-fade-in">
            <h2>Course Assignments</h2>
            
            {course.assignments?.length === 0 ? (
              <div className="empty-sub-panel glass-panel text-center" style={{ marginTop: '20px' }}>
                <Calendar size={40} className="text-muted" />
                <p>No assignments created yet for this course.</p>
              </div>
            ) : (
              <div className="assignments-list" style={{ marginTop: '20px' }}>
                {course.assignments.map((assign) => {
                  // Find submission for this assignment
                  const submission = submissions.find(sub => sub.assignmentId === assign._id);
                  const isSubmitted = !!submission;
                  const gradeAssigned = submission && submission.status === 'graded';

                  return (
                    <div key={assign._id} className="assignment-item-card glass-panel">
                      
                      <div className="assign-header">
                        <h3>{assign.title}</h3>
                        
                        <div className="header-meta-group">
                          <span className="points-badge"><Award size={14} /> {assign.maxPoints} pts</span>
                          
                          {/* Submission status tag */}
                          {isSubmitted ? (
                            gradeAssigned ? (
                              <span className="status-tag status-graded">Graded: {submission.grade} / {assign.maxPoints}</span>
                            ) : (
                              <span className="status-tag status-pending">Submitted (Pending Grade)</span>
                            )
                          ) : (
                            <span className="status-tag status-unsubmitted">Not Submitted</span>
                          )}
                        </div>
                      </div>

                      <p className="assign-desc">{assign.description}</p>
                      
                      <div className="assign-footer" style={{ marginBottom: '20px' }}>
                        <div className="due-date-meta">
                          <Clock size={14} />
                          <span>Due: {new Date(assign.dueDate).toLocaleString()}</span>
                        </div>
                        {assign.fileUrl && (
                          <a 
                            href={assign.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="template-link"
                          >
                            Download reference guides <ExternalLink size={12} />
                          </a>
                        )}
                      </div>

                      {/* SUBMISSION BLOCK */}
                      <div className="submission-portal-box glass-panel">
                        {isSubmitted ? (
                          <div className="submission-details-grid">
                            <div>
                              <h4>Your Submission</h4>
                              <p className="sub-file-info">
                                <FileText size={14} />
                                <a href={submission.submissionFile} target="_blank" rel="noopener noreferrer" className="submitted-file-link">
                                  {submission.fileName || 'View Submitted Document'}
                                </a>
                              </p>
                              <span className="sub-date">Submitted on: {new Date(submission.submittedAt).toLocaleString()}</span>
                            </div>

                            {gradeAssigned && (
                              <div className="submission-grades-box glass-panel">
                                <h4>Feedback & Grades</h4>
                                <p className="grade-score">{submission.grade} / {assign.maxPoints} points</p>
                                {submission.feedback ? (
                                  <p className="grade-comments">Comments: "{submission.feedback}"</p>
                                ) : (
                                  <p className="grade-comments-muted">No teacher remarks.</p>
                                )}
                              </div>
                            )}

                            {/* Option to resubmit if not graded */}
                            {!gradeAssigned && (
                              <div style={{ marginTop: '15px' }}>
                                <label className="resubmit-trigger-btn" onClick={() => {
                                  // toggle state to allow file selection again
                                  if (submittingFileId === assign._id) {
                                    setSubmittingFileId(null);
                                  } else {
                                    setSubmittingFileId(assign._id);
                                  }
                                }}>
                                  {submittingFileId === assign._id ? 'Cancel Resubmission' : 'Resubmit Homework'}
                                </label>
                              </div>
                            )}
                          </div>
                        ) : null}

                        {/* File Upload Form (Shows if not submitted OR if student triggers resubmission) */}
                        {(!isSubmitted || (submittingFileId === assign._id)) && (
                          <form onSubmit={(e) => handleUploadHomework(e, assign._id)} className="homework-upload-form">
                            <h4 style={{ marginBottom: '10px' }}>Upload Homework Submission</h4>
                            <div className="homework-drop-zone">
                              <UploadCloud size={30} className="upload-icon" />
                              <p>{(submittingFileId === assign._id && homeworkFile) ? `Selected: ${homeworkFile.name}` : 'Drop PDF or Document to submit'}</p>
                              <input 
                                type="file" 
                                className="file-input-overlay"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => handleHomeworkFileChange(e, assign._id)}
                                required
                              />
                            </div>
                            
                            {submittingFileId === assign._id && homeworkFile && (
                              <div className="homework-submit-row animate-fade-in" style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button 
                                  type="submit" 
                                  className="btn btn-primary"
                                  disabled={uploadingHomework}
                                >
                                  {uploadingHomework ? 'Uploading to Server...' : 'Submit Assignment'}
                                </button>
                              </div>
                            )}
                          </form>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: QUIZZES */}
        {activeTab === 'quizzes' && (
          <div className="panel-tab-body animate-fade-in">
            <h2>Course Assessments</h2>
            
            {course.quizzes?.length === 0 ? (
              <div className="empty-sub-panel glass-panel text-center" style={{ marginTop: '20px' }}>
                <HelpCircle size={40} className="text-muted" />
                <p>No quizzes available yet in this classroom.</p>
              </div>
            ) : (
              <div className="quizzes-grid" style={{ marginTop: '20px' }}>
                {course.quizzes.map((quiz) => (
                  <div key={quiz._id} className="quiz-card-item glass-panel">
                    <div className="quiz-item-header">
                      <h3>{quiz.title}</h3>
                      <span className="badge badge-student">{quiz.questions?.length || 0} Questions</span>
                    </div>
                    
                    <p className="quiz-card-description" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px' }}>
                      Take multiple-choice tests, review results, and inspect incorrect selections.
                    </p>

                    {(() => {
                      const sub = quizSubmissions.find(s => s.quizId === quiz._id);
                      if (sub) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                            <span className="badge badge-admin" style={{ padding: '8px 12px', fontSize: '0.85rem', width: '100%', justifyContent: 'center' }}>
                              Completed: {sub.score} / {sub.totalQuestions} ({sub.percentage}%)
                            </span>
                            <button 
                              className="btn btn-secondary" 
                              onClick={() => showCompletedQuizSummary(quiz, sub)}
                              style={{ width: '100%' }}
                            >
                              Review Submission
                            </button>
                          </div>
                        );
                      }
                      return (
                        <button 
                          className="btn btn-primary" 
                          onClick={() => startQuiz(quiz)}
                          style={{ width: '100%' }}
                        >
                          Start Assessment
                        </button>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default StudentCourseDetail;
