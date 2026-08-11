import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useSelector } from 'react-redux';
import { Search, Trash2, ShieldAlert, GraduationCap, Users, User, AlertCircle, Check } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import './AdminUsers.css';

const AdminUsers = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/users');
      setUsers(response.data.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch user registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (id, name) => {
    if (id === currentUser?.id) {
      setError('You cannot delete your own admin account.');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete user "${name}"? This action is permanent.`)) {
      return;
    }

    try {
      setMessage(null);
      setError(null);
      const response = await api.delete(`/admin/users/${id}`);
      setMessage(response.data.message);
      setUsers(users.filter((u) => u._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // Filter users based on search string and selected role filter
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Calculate statistics
  const stats = {
    total: users.length,
    students: users.filter((u) => u.role === 'student').length,
    teachers: users.filter((u) => u.role === 'teacher').length,
    admins: users.filter((u) => u.role === 'admin').length,
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'student': return 'badge-student';
      case 'teacher': return 'badge-teacher';
      case 'admin': return 'badge-admin';
      default: return 'badge-pending';
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage={false} />;
  }

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-header">
        <h2>User Registry Control</h2>
        <p>Monitor platform onboarding, verify user records, and adjust registrations.</p>
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

      {/* Stats Counter Boxes */}
      <div className="stats-summary">
        <div className="stat-item-box glass-panel">
          <div className="stat-icon-container" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)' }}>
            <Users size={20} />
          </div>
          <div>
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>

        <div className="stat-item-box glass-panel">
          <div className="stat-icon-container" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent)' }}>
            <User size={20} />
          </div>
          <div>
            <div className="stat-number">{stats.students}</div>
            <div className="stat-label">Students</div>
          </div>
        </div>

        <div className="stat-item-box glass-panel">
          <div className="stat-icon-container" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <GraduationCap size={20} />
          </div>
          <div>
            <div className="stat-number">{stats.teachers}</div>
            <div className="stat-label">Teachers</div>
          </div>
        </div>

        <div className="stat-item-box glass-panel">
          <div className="stat-icon-container" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="stat-number">{stats.admins}</div>
            <div className="stat-label">Admins</div>
          </div>
        </div>
      </div>

      {/* Search and Filters Controls */}
      <div className="users-controls">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input search-input"
          />
        </div>

        <div className="filter-wrapper">
          {['all', 'student', 'teacher', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`filter-btn ${roleFilter === role ? 'active' : ''}`}
            >
              {role.charAt(0).toUpperCase() + role.slice(1) + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container glass-panel">
        {filteredUsers.length === 0 ? (
          <div style={{ padding: '40px', textAlignment: 'center', color: 'var(--text-secondary)' }}>
            No users match your criteria.
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Access Role</th>
                <th>Approval State</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((userObj) => (
                <tr key={userObj._id}>
                  <td>
                    <div className="user-identity-cell">
                      <div className="user-avatar-circle">
                        {userObj.avatar ? (
                          <img src={userObj.avatar} alt={userObj.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          userObj.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="user-display-name">{userObj.name}</div>
                        <div className="user-display-email">{userObj.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getRoleBadgeClass(userObj.role)}`}>
                      {userObj.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${userObj.isApproved ? 'badge-admin' : 'badge-pending'}`}>
                      {userObj.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    {new Date(userObj.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDeleteUser(userObj._id, userObj.name)}
                      disabled={userObj._id === currentUser?.id}
                      className="btn-icon-danger"
                      title={userObj._id === currentUser?.id ? "You cannot delete your own admin account" : "Delete user"}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
