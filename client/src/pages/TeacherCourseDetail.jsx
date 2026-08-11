import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, Video, Calendar, Award, 
  HelpCircle, UploadCloud, Plus, Trash2, ExternalLink, 
  Users, CheckCircle, AlertCircle, Eye, Clipboard, ListPlus
} from 'lucide-react';
import courseService from '../services/courseService';
import './TeacherCourseDetail.css';

const TeacherCourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State Variables
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Navigation Tabs: 'materials' | 'assignments' | 'quizzes' | 'students'
  const [activeTab, setActiveTab] = useState('materials');

  // Form toggles
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);

  // Material Upload State
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialFile, setMaterialFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Assignment Form State
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '',
    dueDate: '',
    fileUrl: '',
    maxPoints: 100
  });
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  // Quiz Creator State
  const [quizTitle, setQuizTitle] = useState('');
  const [quizQuestions, setQuizQuestions] = useState([
    { questionText: '', options: ['', ''], correctAnswerIndex: 0 }
  ]);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // CRUD Edit states
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [editingQuizId, setEditingQuizId] = useState(null);

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const res = await courseService.getCourseDetails(id);
      if (res.success) {
        setCourse(res.data);
      } else {
        setError(res.message || 'Failed to fetch course details');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error loading course details');
    } finally {
      setLoading(false);
    }
  };

  // --- Material Upload Handlers ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setMaterialFile(e.target.files[0]);
      // Pre-fill title with file name if empty
      if (!materialTitle) {
        const nameWithoutExt = e.target.files[0].name.split('.').slice(0, -1).join('.');
        setMaterialTitle(nameWithoutExt);
      }
    }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!materialFile || !materialTitle) {
      alert('Please provide a file and a title');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('title', materialTitle);
      formData.append('file', materialFile);

      const res = await courseService.uploadMaterial(id, formData);
      if (res.success) {
        setSuccessMsg('Material uploaded and added successfully!');
        setMaterialTitle('');
        setMaterialFile(null);
        setShowUploadForm(false);
        fetchCourseDetails();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(res.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this study material? This will delete it from Cloudinary and the database.')) {
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await courseService.deleteMaterial(id, materialId);
      if (res.success) {
        setSuccessMsg('Material deleted successfully!');
        fetchCourseDetails();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error deleting material');
    } finally {
      setLoading(false);
    }
  };

  // --- Assignment Handlers ---
  const handleAssignmentChange = (e) => {
    const { name, value } = e.target;
    setAssignmentData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    const { title, description, dueDate, maxPoints } = assignmentData;
    if (!title || !description || !dueDate || !maxPoints) {
      alert('Please fill out all required fields');
      return;
    }

    try {
      setSubmittingAssignment(true);
      setError('');
      
      let res;
      if (editingAssignmentId) {
        res = await courseService.updateAssignment(id, editingAssignmentId, assignmentData);
      } else {
        res = await courseService.createAssignment(id, assignmentData);
      }

      if (res.success) {
        setSuccessMsg(editingAssignmentId ? 'Assignment updated successfully!' : 'Assignment created successfully!');
        setAssignmentData({
          title: '',
          description: '',
          dueDate: '',
          fileUrl: '',
          maxPoints: 100
        });
        setEditingAssignmentId(null);
        setShowAssignmentForm(false);
        fetchCourseDetails();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(res.message || 'Failed to save assignment');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error saving assignment');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const handleEditAssignment = (assign) => {
    setAssignmentData({
      title: assign.title,
      description: assign.description,
      dueDate: new Date(assign.dueDate).toISOString().slice(0, 16),
      fileUrl: assign.fileUrl || '',
      maxPoints: assign.maxPoints
    });
    setEditingAssignmentId(assign._id);
    setShowAssignmentForm(true);
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await courseService.deleteAssignment(id, assignmentId);
      if (res.success) {
        setSuccessMsg('Assignment deleted successfully!');
        fetchCourseDetails();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error deleting assignment');
    } finally {
      setLoading(false);
    }
  };

  // --- Quiz Creator Handlers ---
  const handleQuestionTextChange = (qIndex, text) => {
    setQuizQuestions(prev => {
      const updated = [...prev];
      updated[qIndex].questionText = text;
      return updated;
    });
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    setQuizQuestions(prev => {
      const updated = [...prev];
      updated[qIndex].options[optIndex] = value;
      return updated;
    });
  };

  const handleCorrectAnswerChange = (qIndex, value) => {
    setQuizQuestions(prev => {
      const updated = [...prev];
      updated[qIndex].correctAnswerIndex = parseInt(value, 10);
      return updated;
    });
  };

  const addOption = (qIndex) => {
    setQuizQuestions(prev => {
      const updated = [...prev];
      updated[qIndex].options.push('');
      return updated;
    });
  };

  const removeOption = (qIndex, optIndex) => {
    setQuizQuestions(prev => {
      const updated = [...prev];
      if (updated[qIndex].options.length > 2) {
        updated[qIndex].options.splice(optIndex, 1);
        // Correct answer boundary check
        if (updated[qIndex].correctAnswerIndex >= updated[qIndex].options.length) {
          updated[qIndex].correctAnswerIndex = updated[qIndex].options.length - 1;
        }
      } else {
        alert('A question must have at least 2 options');
      }
      return updated;
    });
  };

  const addQuestion = () => {
    setQuizQuestions(prev => [
      ...prev,
      { questionText: '', options: ['', ''], correctAnswerIndex: 0 }
    ]);
  };

  const removeQuestion = (qIndex) => {
    setQuizQuestions(prev => {
      if (prev.length > 1) {
        return prev.filter((_, idx) => idx !== qIndex);
      } else {
        alert('A quiz must have at least 1 question');
        return prev;
      }
    });
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!quizTitle) {
      alert('Please provide a quiz title');
      return;
    }

    // Basic questions validation
    for (let i = 0; i < quizQuestions.length; i++) {
      const q = quizQuestions[i];
      if (!q.questionText) {
        alert(`Question ${i + 1} has no text`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j]) {
          alert(`Question ${i + 1}, Option ${j + 1} is empty`);
          return;
        }
      }
    }

    try {
      setSubmittingQuiz(true);
      setError('');
      const quizPayload = {
        title: quizTitle,
        questions: quizQuestions
      };
      
      let res;
      if (editingQuizId) {
        res = await courseService.updateQuiz(id, editingQuizId, quizPayload);
      } else {
        res = await courseService.createQuiz(id, quizPayload);
      }

      if (res.success) {
        setSuccessMsg(editingQuizId ? 'Quiz updated successfully!' : 'Quiz created successfully!');
        setQuizTitle('');
        setQuizQuestions([{ questionText: '', options: ['', ''], correctAnswerIndex: 0 }]);
        setEditingQuizId(null);
        setShowQuizForm(false);
        fetchCourseDetails();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(res.message || 'Failed to save quiz');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error saving quiz');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleEditQuiz = (quiz) => {
    setQuizTitle(quiz.title);
    setQuizQuestions(quiz.questions.map(q => ({
      questionText: q.questionText,
      options: [...q.options],
      correctAnswerIndex: q.correctAnswerIndex
    })));
    setEditingQuizId(quiz._id);
    setShowQuizForm(true);
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) {
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await courseService.deleteQuiz(id, quizId);
      if (res.success) {
        setSuccessMsg('Quiz deleted successfully!');
        fetchCourseDetails();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error deleting quiz');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="detail-loading-wrapper">
        <div className="loading-spinner"></div>
        <p>Loading course curriculum details...</p>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="course-error-wrapper animate-fade-in">
        <AlertCircle size={40} className="error-icon" />
        <h2>Error Accessing Course</h2>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/teacher/courses')}>
          <ArrowLeft size={16} /> Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="course-detail-container animate-fade-in">
      {/* Header and Back navigation */}
      <div className="detail-header-nav">
        <button className="back-link btn btn-secondary" onClick={() => navigate('/teacher/courses')}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="header-badge-section">
          <span className="badge badge-teacher">Instructor Dashboard</span>
        </div>
      </div>

      <div className="course-header-banner glass-panel">
        <div className="banner-primary-info">
          <h1 className="banner-title">{course.title}</h1>
          <p className="banner-desc">{course.description}</p>
        </div>
        <div className="banner-code-box">
          <span className="code-label">Student Invite Code</span>
          <div className="code-display">
            <span>{course.inviteCode}</span>
            <button 
              className="copy-btn"
              onClick={() => {
                navigator.clipboard.writeText(course.inviteCode);
                alert('Invite Code copied to clipboard!');
              }}
              title="Copy to Clipboard"
            >
              <Clipboard size={16} />
            </button>
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

      {/* Navigation Tabs */}
      <div className="detail-tabs-bar">
        <button 
          className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
          onClick={() => setActiveTab('materials')}
        >
          <FileText size={18} /> Materials ({course.materials?.length || 0})
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
        <button 
          className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <Users size={18} /> Enrolled Students ({course.students?.length || 0})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="tab-content-panel">
        
        {/* TAB 1: MATERIALS */}
        {activeTab === 'materials' && (
          <div className="panel-tab-body animate-fade-in">
            <div className="panel-section-header">
              <h2>Course Materials</h2>
              {!showUploadForm && (
                <button className="btn btn-primary" onClick={() => setShowUploadForm(true)}>
                  <Plus size={16} /> Upload Material
                </button>
              )}
            </div>

            {showUploadForm && (
              <form onSubmit={handleUploadMaterial} className="upload-form-block glass-panel animate-fade-in">
                <h3>Upload Resource (PDF or Video)</h3>
                
                <div className="form-group">
                  <label className="form-label">Material Title</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="e.g. Lecture 1: Core Concepts"
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Upload File</label>
                  <div className="file-drop-zone">
                    <UploadCloud size={40} className="upload-icon" />
                    <p>{materialFile ? `Selected: ${materialFile.name}` : 'Select PDF or MP4/WebM video file'}</p>
                    <input 
                      type="file" 
                      className="file-input-overlay"
                      accept=".pdf,video/*"
                      onChange={handleFileChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-actions-row">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowUploadForm(false);
                      setMaterialFile(null);
                      setMaterialTitle('');
                    }}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading to Cloudinary...' : 'Upload & Add'}
                  </button>
                </div>
              </form>
            )}

            {course.materials?.length === 0 ? (
              <div className="empty-sub-panel glass-panel text-center">
                <FileText size={40} className="text-muted" />
                <p>No study materials uploaded yet. Provide lectures or references for students.</p>
              </div>
            ) : (
              <div className="materials-list">
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
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <a 
                        href={mat.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-secondary view-mat-btn"
                      >
                        View Link <ExternalLink size={14} />
                      </a>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleDeleteMaterial(mat._id)}
                        style={{ padding: '8px 12px' }}
                        title="Delete Material"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <div className="panel-tab-body animate-fade-in">
            <div className="panel-section-header">
              <h2>Assignments</h2>
              {!showAssignmentForm && (
                <button className="btn btn-primary" onClick={() => setShowAssignmentForm(true)}>
                  <Plus size={16} /> Create Assignment
                </button>
              )}
            </div>

            {showAssignmentForm && (
              <form onSubmit={handleCreateAssignment} className="assignment-form-block glass-panel animate-fade-in">
                <h3>Build Assignment</h3>
                
                <div className="form-group">
                  <label className="form-label">Assignment Title</label>
                  <input 
                    type="text" 
                    name="title"
                    className="form-input"
                    placeholder="e.g. Essay 1: Research Paper"
                    value={assignmentData.title}
                    onChange={handleAssignmentChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Instructions / Description</label>
                  <textarea 
                    name="description"
                    className="form-input form-textarea"
                    placeholder="Provide details about formatting, guidelines, and what students need to cover."
                    value={assignmentData.description}
                    onChange={handleAssignmentChange}
                    rows={4}
                    required
                  />
                </div>

                <div className="form-row-two-col">
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input 
                      type="datetime-local" 
                      name="dueDate"
                      className="form-input"
                      value={assignmentData.dueDate}
                      onChange={handleAssignmentChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Points</label>
                    <input 
                      type="number" 
                      name="maxPoints"
                      className="form-input"
                      min={1}
                      value={assignmentData.maxPoints}
                      onChange={handleAssignmentChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Optional Template File URL</label>
                  <input 
                    type="url" 
                    name="fileUrl"
                    className="form-input"
                    placeholder="e.g. https://cloudinary... (guidelines template)"
                    value={assignmentData.fileUrl}
                    onChange={handleAssignmentChange}
                  />
                </div>

                <div className="form-actions-row">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowAssignmentForm(false);
                      setEditingAssignmentId(null);
                      setAssignmentData({
                        title: '',
                        description: '',
                        dueDate: '',
                        fileUrl: '',
                        maxPoints: 100
                      });
                    }}
                    disabled={submittingAssignment}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submittingAssignment}
                  >
                    {submittingAssignment ? 'Saving...' : (editingAssignmentId ? 'Update Assignment' : 'Create Assignment')}
                  </button>
                </div>
              </form>
            )}

            {course.assignments?.length === 0 ? (
              <div className="empty-sub-panel glass-panel text-center">
                <Calendar size={40} className="text-muted" />
                <p>No assignments created yet. Publish assignments to evaluate coursework.</p>
              </div>
            ) : (
              <div className="assignments-list">
                {course.assignments.map((assign) => (
                  <div key={assign._id} className="assignment-item-card glass-panel">
                    <div className="assign-header">
                      <h3>{assign.title}</h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="points-badge"><Award size={14} /> {assign.maxPoints} pts</span>
                        <button 
                          className="btn btn-primary" 
                          onClick={() => navigate(`/teacher/courses/${id}/assignments/${assign._id}/submissions`)}
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        >
                          Submissions
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleEditAssignment(assign)}
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleDeleteAssignment(assign._id)}
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="assign-desc">{assign.description}</p>
                    <div className="assign-footer">
                      <div className="due-date-meta">
                        <Calendar size={14} />
                        <span>Due: {new Date(assign.dueDate).toLocaleString()}</span>
                      </div>
                      {assign.fileUrl && (
                        <a 
                          href={assign.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="template-link"
                        >
                          Reference File <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: QUIZZES */}
        {activeTab === 'quizzes' && (
          <div className="panel-tab-body animate-fade-in">
            <div className="panel-section-header">
              <h2>Course Quizzes</h2>
              {!showQuizForm && (
                <button className="btn btn-primary" onClick={() => setShowQuizForm(true)}>
                  <Plus size={16} /> Create Quiz
                </button>
              )}
            </div>

            {showQuizForm && (
              <form onSubmit={handleCreateQuiz} className="quiz-form-block glass-panel animate-fade-in">
                <h3>Quiz Builder Wizard</h3>
                
                <div className="form-group" style={{ marginBottom: '25px' }}>
                  <label className="form-label">Quiz Title</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="e.g. Midterm Quiz on React"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="quiz-questions-builder-section">
                  <h3>Questions ({quizQuestions.length})</h3>
                  
                  {quizQuestions.map((q, qIdx) => (
                    <div key={qIdx} className="question-builder-item glass-panel">
                      <div className="q-builder-header">
                        <h4>Question {qIdx + 1}</h4>
                        {quizQuestions.length > 1 && (
                          <button 
                            type="button" 
                            className="btn-text-danger"
                            onClick={() => removeQuestion(qIdx)}
                          >
                            <Trash2 size={16} /> Remove
                          </button>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Question Text</label>
                        <input 
                          type="text" 
                          className="form-input"
                          placeholder="e.g. What is JSX?"
                          value={q.questionText}
                          onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                          required
                        />
                      </div>

                      <div className="options-builder-block">
                        <label className="form-label">Options</label>
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="option-input-row">
                            <span className="option-letter">{String.fromCharCode(65 + optIdx)}.</span>
                            <input 
                              type="text"
                              className="form-input option-text-field"
                              placeholder={`Option ${optIdx + 1}`}
                              value={opt}
                              onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                              required
                            />
                            {q.options.length > 2 && (
                              <button 
                                type="button" 
                                className="remove-opt-btn"
                                onClick={() => removeOption(qIdx, optIdx)}
                                title="Remove Option"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                        {q.options.length < 6 && (
                          <button 
                            type="button" 
                            className="btn btn-secondary add-opt-btn-small"
                            onClick={() => addOption(qIdx)}
                          >
                            <Plus size={12} /> Add Option
                          </button>
                        )}
                      </div>

                      <div className="form-group correct-answer-select-group">
                        <label className="form-label">Select Correct Answer</label>
                        <select 
                          className="form-input"
                          value={q.correctAnswerIndex}
                          onChange={(e) => handleCorrectAnswerChange(qIdx, e.target.value)}
                        >
                          {q.options.map((_, optIdx) => (
                            <option key={optIdx} value={optIdx}>
                              Option {String.fromCharCode(65 + optIdx)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  <button 
                    type="button" 
                    className="btn btn-secondary add-q-btn"
                    onClick={addQuestion}
                  >
                    <ListPlus size={16} /> Add Question to Quiz
                  </button>
                </div>

                <div className="form-actions-row" style={{ marginTop: '30px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowQuizForm(false);
                      setQuizTitle('');
                      setQuizQuestions([{ questionText: '', options: ['', ''], correctAnswerIndex: 0 }]);
                      setEditingQuizId(null);
                    }}
                    disabled={submittingQuiz}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submittingQuiz}
                  >
                    {submittingQuiz ? 'Saving...' : (editingQuizId ? 'Update Quiz' : 'Save & Create Quiz')}
                  </button>
                </div>
              </form>
            )}

            {course.quizzes?.length === 0 ? (
              <div className="empty-sub-panel glass-panel text-center">
                <HelpCircle size={40} className="text-muted" />
                <p>No quizzes available yet. Create active multiple-choice assessments.</p>
              </div>
            ) : (
              <div className="quizzes-grid">
                {course.quizzes.map((quiz) => (
                  <div key={quiz._id} className="quiz-card-item glass-panel">
                    <div className="quiz-item-header">
                      <h3>{quiz.title}</h3>
                      <span className="badge badge-student">{quiz.questions?.length || 0} Questions</span>
                    </div>
                    <div className="quiz-item-questions-list">
                      {quiz.questions?.slice(0, 3).map((q, idx) => (
                        <div key={idx} className="quiz-item-question-preview">
                          <span className="q-num">{idx + 1}.</span>
                          <span className="q-preview-text">{q.questionText}</span>
                        </div>
                      ))}
                      {quiz.questions?.length > 3 && (
                        <p className="more-questions-indicator">+{quiz.questions.length - 3} more questions...</p>
                      )}
                    </div>
                    <div className="quiz-card-actions">
                      <button 
                        className="btn btn-primary" 
                        onClick={() => navigate(`/teacher/courses/${id}/quizzes/${quiz._id}/submissions`)}
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      >
                        Results
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => handleEditQuiz(quiz)}
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => handleDeleteQuiz(quiz._id)}
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ENROLLED STUDENTS */}
        {activeTab === 'students' && (
          <div className="panel-tab-body animate-fade-in">
            <h2>Enrolled Students</h2>
            
            {course.students?.length === 0 ? (
              <div className="empty-sub-panel glass-panel text-center" style={{ marginTop: '20px' }}>
                <Users size={40} className="text-muted" />
                <p>No students enrolled yet. Share the invite code <strong>{course.inviteCode}</strong> to register students.</p>
              </div>
            ) : (
              <div className="students-table-container glass-panel">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email Address</th>
                      <th>Joined Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {course.students.map((student) => (
                      <tr key={student._id}>
                        <td className="student-name-cell">
                          {student.avatar ? (
                            <img src={student.avatar} alt="Avatar" className="student-avatar" />
                          ) : (
                            <div className="student-avatar-fallback">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span>{student.name}</span>
                        </td>
                        <td>{student.email}</td>
                        <td>{new Date().toLocaleDateString()}</td> {/* Fallback for mock */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherCourseDetail;
