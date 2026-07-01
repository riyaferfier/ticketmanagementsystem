import React, { useState, useEffect } from 'react';
import { Users, Settings, BarChart3, Unlock, ShieldAlert, CheckCircle2, AlertCircle, PlusCircle, Trash2, ShieldCheck, Activity } from 'lucide-react';
import { getUsersApi, updateUserApi, getConfigApi, updateConfigApi, getReportsApi } from '../api';

export default function AdminPortalPage({ user }) {
  const [activeTab, setActiveTab] = useState('users'); // users, config, reports
  const [users, setUsers] = useState([]);
  const [config, setConfig] = useState({ categories: [], priorities: [] });
  const [reports, setReports] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New category/priority input
  const [newCategory, setNewCategory] = useState('');
  const [newPriority, setNewPriority] = useState('');

  useEffect(() => {
    loadAllData();
  }, [user]);

  async function loadAllData() {
    setLoading(true);
    try {
      const [uRes, cRes, rRes] = await Promise.all([
        getUsersApi(),
        getConfigApi(),
        getReportsApi()
      ]);
      setUsers(uRes.users || []);
      setConfig({ categories: cRes.categories || [], priorities: cRes.priorities || [] });
      setReports(rRes.stats || null);
    } catch (err) {
      setError('Failed to load admin portal data');
    } finally {
      setLoading(false);
    }
  }

  // Unlock User Account
  const handleUnlockUser = async (userId, userName) => {
    setError('');
    setSuccessMsg('');
    try {
      await updateUserApi(userId, { locked: false });
      setSuccessMsg(`Account for ${userName} unlocked successfully! Attempt count reset to 0.`);
      loadAllData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to unlock user');
    }
  };

  // Toggle user active/inactive status
  const handleToggleStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await updateUserApi(userId, { status: nextStatus });
      loadAllData();
    } catch (err) {
      setError('Failed to update status');
    }
  };

  // Add Category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    const updated = [...config.categories, newCategory.trim()];
    try {
      await updateConfigApi({ categories: updated });
      setConfig(prev => ({ ...prev, categories: updated }));
      setNewCategory('');
      setSuccessMsg('Category added successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to update categories');
    }
  };

  // Add Priority
  const handleAddPriority = async (e) => {
    e.preventDefault();
    if (!newPriority.trim()) return;
    const updated = [...config.priorities, newPriority.trim()];
    try {
      await updateConfigApi({ priorities: updated });
      setConfig(prev => ({ ...prev, priorities: updated }));
      setNewPriority('');
      setSuccessMsg('Priority added successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to update priorities');
    }
  };

  return (
    <div className="page-wrapper" data-testid="admin-portal-page">
      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck color="#f43f5e" size={32} />
          Administration & System Control Center
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage user accounts, unlock locked profiles, configure ticketing taxonomies, and view system telemetry.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('users')}
          style={activeTab === 'users' ? { background: 'var(--grad-rose)' } : {}}
          data-testid="admin-tab-users"
        >
          <Users size={18} /> User Directory & Security ({users.length})
        </button>

        <button
          className={`btn ${activeTab === 'config' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('config')}
          style={activeTab === 'config' ? { background: 'var(--grad-rose)' } : {}}
          data-testid="admin-tab-config"
        >
          <Settings size={18} /> System Configuration
        </button>

        <button
          className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('reports')}
          style={activeTab === 'reports' ? { background: 'var(--grad-rose)' } : {}}
          data-testid="admin-tab-reports"
        >
          <BarChart3 size={18} /> Reports & Telemetry
        </button>
      </div>

      {error && <div className="alert alert-error animate-fade-in"><AlertCircle size={18} /><span>{error}</span></div>}
      {successMsg && <div className="alert alert-success animate-fade-in"><CheckCircle2 size={18} /><span>{successMsg}</span></div>}

      {loading ? (
        <p style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading administrative records...</p>
      ) : (
        <>
          {/* TAB 1: User Directory & Security */}
          {activeTab === 'users' && (
            <div className="glass-panel" style={{ padding: '1.5rem' }} data-testid="admin-users-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem' }}>User Accounts & Lockout Status</h2>
                <button className="btn btn-secondary btn-sm" onClick={loadAllData} data-testid="refresh-users-btn">
                  Refresh Users
                </button>
              </div>

              <div className="table-container">
                <table className="custom-table" data-testid="admin-users-table">
                  <thead>
                    <tr>
                      <th>User Name</th>
                      <th>Email Address</th>
                      <th>Role</th>
                      <th>Account Status</th>
                      <th>Failed Logins</th>
                      <th>Security Lockout</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} data-testid={`user-row-${u.id}`}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }} data-testid={`user-name-${u.id}`}>
                          {u.name}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }} data-testid={`user-email-${u.id}`}>
                          {u.email}
                        </td>
                        <td>
                          <span className={`role-badge ${u.role}`} data-testid={`user-role-${u.id}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: u.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                            color: u.status === 'active' ? '#34d399' : '#94a3b8'
                          }} data-testid={`user-status-${u.id}`}>
                            {u.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: (u.failedAttempts >= 3) ? '#f59e0b' : 'var(--text-primary)' }} data-testid={`user-attempts-${u.id}`}>
                          {u.failedAttempts || 0} / 5
                        </td>
                        <td>
                          {u.locked ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#fb7185', background: 'rgba(244, 63, 94, 0.15)', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }} data-testid={`user-locked-badge-${u.id}`}>
                              <ShieldAlert size={14} /> LOCKED
                            </span>
                          ) : (
                            <span style={{ color: '#34d399', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }} data-testid={`user-unlocked-badge-${u.id}`}>
                              <CheckCircle2 size={14} /> Unlocked
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {u.locked ? (
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleUnlockUser(u.id, u.name)}
                                data-testid={`unlock-btn-${u.id}`}
                                title="Unlock account and reset failed login attempts"
                              >
                                <Unlock size={14} /> Unlock Account
                              </button>
                            ) : (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleToggleStatus(u.id, u.status)}
                                data-testid={`toggle-status-btn-${u.id}`}
                              >
                                {u.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: System Configuration */}
          {activeTab === 'config' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
              
              {/* Categories Config Card */}
              <div className="glass-panel" style={{ padding: '1.75rem' }} data-testid="admin-categories-panel">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
                  Support Categories ({config.categories.length})
                </h3>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {config.categories.map((cat, i) => (
                    <span key={i} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a855f7', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 500 }} data-testid={`config-cat-${i}`}>
                      {cat}
                    </span>
                  ))}
                </div>

                <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '0.5rem' }} data-testid="add-category-form">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="New category name..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    data-testid="new-category-input"
                  />
                  <button type="submit" className="btn btn-primary" data-testid="add-category-btn">
                    <PlusCircle size={16} /> Add
                  </button>
                </form>
              </div>

              {/* Priorities Config Card */}
              <div className="glass-panel" style={{ padding: '1.75rem' }} data-testid="admin-priorities-panel">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
                  Priority Levels ({config.priorities.length})
                </h3>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {config.priorities.map((pri, i) => (
                    <span key={i} className={`badge badge-priority ${pri}`} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }} data-testid={`config-pri-${i}`}>
                      {pri}
                    </span>
                  ))}
                </div>

                <form onSubmit={handleAddPriority} style={{ display: 'flex', gap: '0.5rem' }} data-testid="add-priority-form">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="New priority level..."
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    data-testid="new-priority-input"
                  />
                  <button type="submit" className="btn btn-primary" data-testid="add-priority-btn">
                    <PlusCircle size={16} /> Add
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 3: Reports & Telemetry */}
          {activeTab === 'reports' && reports && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              <div className="stats-grid">
                <div className="glass-panel stat-card open">
                  <span className="stat-title">Total System Tickets</span>
                  <span className="stat-value">{reports.total}</span>
                </div>
                <div className="glass-panel stat-card progress">
                  <span className="stat-title">Open / Pending</span>
                  <span className="stat-value" style={{ color: '#34d399' }}>{reports.open}</span>
                </div>
                <div className="glass-panel stat-card resolved">
                  <span className="stat-title">In Progress</span>
                  <span className="stat-value" style={{ color: '#fbbf24' }}>{reports.inProgress}</span>
                </div>
                <div className="glass-panel stat-card closed">
                  <span className="stat-title">Resolved & Closed</span>
                  <span className="stat-value" style={{ color: '#22d3ee' }}>{reports.resolved + reports.closed}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                
                {/* Breakdown by Category */}
                <div className="glass-panel" style={{ padding: '1.75rem' }} data-testid="report-categories-panel">
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Tickets by Support Category</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {Object.entries(reports.byCategory || {}).map(([cat, count]) => {
                      const percentage = reports.total > 0 ? Math.round((count / reports.total) * 100) : 0;
                      return (
                        <div key={cat} data-testid={`report-cat-${cat}`}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                            <span style={{ fontWeight: 500 }}>{cat}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{count} ({percentage}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${percentage}%`, height: '100%', background: 'var(--grad-primary)' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Breakdown by Priority */}
                <div className="glass-panel" style={{ padding: '1.75rem' }} data-testid="report-priorities-panel">
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Tickets by Priority Distribution</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {Object.entries(reports.byPriority || {}).map(([pri, count]) => {
                      const percentage = reports.total > 0 ? Math.round((count / reports.total) * 100) : 0;
                      return (
                        <div key={pri} data-testid={`report-pri-${pri}`}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                            <span style={{ fontWeight: 500 }}>{pri}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{count} ({percentage}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${percentage}%`, height: '100%', background: 'var(--grad-cyan)' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
