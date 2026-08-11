import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Check, X, Users, Calendar, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import './AdminApprovals.css';

const AdminApprovals = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Fetch pending teachers list
  const fetchPendingTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/pending-teachers');
      setTeachers(response.data.data.teachers);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTeachers();
  }, []);

  // Handle approving teacher registration
  const handleApprove = async (id) => {
    try {
      setMessage(null);
      const response = await api.put(`/admin/approve-teacher/${id}`);
      setMessage(response.data.message);
      
      // Update local state by removing approved teacher
      setTeachers(teachers.filter((t) => t._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Approval failed');
    }
  };

  // Handle rejecting teacher registration
  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject and delete this registration?')) {
      return;
    }
    
    try {
      setMessage(null);
      const response = await api.delete(`/admin/reject-teacher/${id}`);
      setMessage(response.data.message);
      
      // Update local state by removing rejected teacher
      setTeachers(teachers.filter((t) => t._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Rejection failed');
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage={false} />;
  }

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-header">
        <h2>Teacher Registrations</h2>
        <p>Review and verify incoming educator credentials before active course access is granted.</p>
      </div>

      {error && (
        <div className="auth-error animate-fade-in" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="glass-panel animate-fade-in" style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--success)', borderRadius: '12px', fontSize: '0.9rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Check size={18} />
          <span>{message}</span>
        </div>
      )}

      {teachers.length === 0 ? (
        <div className="no-teachers-panel glass-panel">
          <Users size={48} className="no-teachers-icon" />
          <h3>No Pending Approvals</h3>
          <p>All registered teachers have been verified. Excellent work!</p>
        </div>
      ) : (
        <div className="teachers-grid">
          {teachers.map((teacher) => (
            <div key={teacher._id} className="teacher-card glass-panel glass-panel-hover">
              <div className="teacher-profile">
                <div className="teacher-avatar-wrapper">
                  {teacher.avatar ? (
                    <img src={teacher.avatar} alt={teacher.name} style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
                  ) : (
                    teacher.name.charAt(0)
                  )}
                </div>
                <div className="teacher-details">
                  <h3>{teacher.name}</h3>
                  <p className="teacher-email">{teacher.email}</p>
                </div>
              </div>

              <div className="teacher-meta">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} />
                  <span>Registered: {new Date(teacher.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="teacher-actions">
                <button
                  onClick={() => handleApprove(teacher._id)}
                  className="btn btn-approve"
                >
                  <Check size={16} />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => handleReject(teacher._id)}
                  className="btn btn-reject"
                >
                  <X size={16} />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminApprovals;
