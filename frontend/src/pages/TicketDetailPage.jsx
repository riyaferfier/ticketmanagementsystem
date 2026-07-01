import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, CheckCircle2, AlertCircle, ShieldAlert, Clock, User, Paperclip, MessageSquare, History, Tag, ShieldCheck, Lock } from 'lucide-react';
import { getTicketByIdApi, updateTicketApi, addCommentApi, closeTicketApi, getUsersApi, assignTicketApi } from '../api';

export default function TicketDetailPage({ ticketId, user, onBack }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Agent update states (US 4)
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [commentText, setCommentText] = useState('');
  const [updating, setUpdating] = useState(false);

  // Admin assign state (US 5)
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Customer close state (US 6)
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closureReason, setClosureReason] = useState('');
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState('');

  useEffect(() => {
    loadTicket();
    if (user.role === 'admin') {
      loadAgents();
    }
  }, [ticketId, user]);

  async function loadTicket() {
    setLoading(true);
    try {
      const res = await getTicketByIdApi(ticketId);
      const t = res.ticket;
      setTicket(t);
      setStatus(t.status);
      setPriority(t.priority);
      setSelectedAgent(t.assignedTo || '');
    } catch (err) {
      setError(err.message || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  }

  async function loadAgents() {
    try {
      const res = await getUsersApi();
      const activeAgents = (res.users || []).filter(u => u.role === 'agent' && u.status === 'active' && !u.locked);
      setAgents(activeAgents);
    } catch (err) {
      console.error('Failed to load active agents:', err);
    }
  }

  // US 4: Agent Status / Priority update
  const handleAgentUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setUpdating(true);
    try {
      const res = await updateTicketApi(ticketId, { status, priority });
      setTicket(res.ticket);
      setSuccessMsg('Ticket status and priority updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update ticket');
    } finally {
      setUpdating(false);
    }
  };

  // US 4: Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setError('');
    setUpdating(true);
    try {
      const res = await addCommentApi(ticketId, commentText.trim());
      setTicket(res.ticket);
      setCommentText('');
      setSuccessMsg('Comment posted successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setUpdating(false);
    }
  };

  // US 5: Admin Assign Ticket
  const handleAssignTicket = async () => {
    if (!selectedAgent) return;
    setError('');
    setSuccessMsg('');
    setAssigning(true);
    try {
      const res = await assignTicketApi(ticketId, selectedAgent);
      setTicket(res.ticket);
      setSuccessMsg(res.message || 'Ticket assigned successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to assign ticket');
    } finally {
      setAssigning(false);
    }
  };

  // US 6: Customer Close Ticket
  const handleCloseTicket = async (e) => {
    e.preventDefault();
    setCloseError('');
    if (!closureReason.trim()) {
      setCloseError('Closure reason is mandatory when archiving a resolved ticket.');
      return;
    }
    setClosing(true);
    try {
      const res = await closeTicketApi(ticketId, closureReason.trim());
      setTicket(res.ticket);
      setShowCloseModal(false);
      setClosureReason('');
      setSuccessMsg(res.message);
    } catch (err) {
      setCloseError(err.message || 'Failed to close ticket');
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return <div className="page-wrapper"><p style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading ticket analysis...</p></div>;
  }

  if (!ticket) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '4rem' }}>
        <ShieldAlert size={48} color="#f43f5e" style={{ margin: '0 auto 1rem' }} />
        <h2>Ticket Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>The requested ticket ID does not exist in our directory.</p>
        <button className="btn btn-secondary" onClick={onBack}>Back to Directory</button>
      </div>
    );
  }

  const isClosed = ticket.status === 'Closed';
  const isCustomer = user.role === 'customer';
  const isAgent = user.role === 'agent';
  const isAdmin = user.role === 'admin';

  return (
    <div className="page-wrapper" data-testid="ticket-detail-page">
      {/* Top Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack} data-testid="back-btn">
          <ArrowLeft size={16} /> Back to Directory
        </button>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* US 6: Customer Close Button (Only visible if status === Resolved AND user is Customer) */}
          {isCustomer && ticket.status === 'Resolved' && !isClosed && (
            <button
              className="btn btn-danger"
              onClick={() => setShowCloseModal(true)}
              data-testid="close-ticket-btn"
            >
              <CheckCircle2 size={18} /> Close & Archive Ticket
            </button>
          )}

          {isClosed && (
            <span className="badge badge-status Closed" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }} data-testid="status-badge-closed">
              <Lock size={16} /> Archived Read-Only
            </span>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error animate-fade-in"><AlertCircle size={18} /><span>{error}</span></div>}
      {successMsg && <div className="alert alert-success animate-fade-in"><CheckCircle2 size={18} /><span>{successMsg}</span></div>}

      {/* US 6 Criteria 3: Read-Only Banner */}
      {isClosed && (
        <div className="alert alert-warning" style={{ background: 'rgba(148, 163, 184, 0.1)', borderColor: 'rgba(148, 163, 184, 0.3)', color: '#cbd5e1' }} data-testid="readonly-banner">
          <Lock size={20} color="#94a3b8" />
          <div>
            <span style={{ fontWeight: 600, display: 'block' }}>This ticket has been closed and archived.</span>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Closure Reason: "{ticket.closureReason || 'Resolved by support'}". Further edits, status changes, or comments are locked.
            </span>
          </div>
        </div>
      )}

      {/* Main Grid: Left Column (Details + Comments) / Right Column (Controls + Timeline) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column: Ticket Info & Comments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Ticket Header & Description Card */}
          <div className="glass-panel" style={{ padding: '2rem' }} data-testid="ticket-info-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#8b5cf6', fontFamily: 'var(--font-heading)' }} data-testid="detail-id">
                  {ticket.id}
                </span>
                <h1 style={{ fontSize: '1.75rem', marginTop: '0.2rem' }} data-testid="detail-title">
                  {ticket.title}
                </h1>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className={`badge badge-priority ${ticket.priority}`} data-testid="detail-priority">
                  {ticket.priority}
                </span>
                <span className={`badge badge-status ${ticket.status.replace(' ', '.')}`} data-testid="detail-status">
                  {ticket.status}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
              <span>Category: <strong style={{ color: 'var(--text-primary)' }}>{ticket.category}</strong></span>
              <span>Created By: <strong style={{ color: 'var(--text-primary)' }}>{ticket.createdByName || ticket.createdBy}</strong></span>
              <span>Date: <strong style={{ color: 'var(--text-primary)' }}>{new Date(ticket.createdAt).toLocaleString()}</strong></span>
            </div>

            <div style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }} data-testid="detail-description">
              {ticket.description}
            </div>

            {ticket.attachment && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.75rem' }} data-testid="detail-attachment">
                <Paperclip size={20} color="#06b6d4" />
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#22d3ee', display: 'block' }}>Attached Diagnostics File</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ticket.attachment}</span>
                </div>
              </div>
            )}
          </div>

          {/* Comments Section (US 4) */}
          <div className="glass-panel" style={{ padding: '2rem' }} data-testid="comments-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <MessageSquare size={20} color="#6366f1" />
              <h2 style={{ fontSize: '1.35rem' }}>Discussion & Notes ({ticket.comments.length})</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {ticket.comments.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0', fontStyle: 'italic' }}>
                  No comments posted on this ticket yet.
                </p>
              ) : (
                ticket.comments.map((cmt) => (
                  <div
                    key={cmt.id}
                    style={{
                      padding: '1.25rem',
                      background: cmt.role === 'agent' || cmt.role === 'admin' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '12px',
                      borderLeft: cmt.role === 'agent' ? '4px solid #a855f7' : cmt.role === 'admin' ? '4px solid #f43f5e' : '4px solid #06b6d4'
                    }}
                    data-testid={`comment-item-${cmt.id}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {cmt.author} <span className={`role-badge ${cmt.role}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', marginLeft: '0.5rem' }}>{cmt.role}</span>
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(cmt.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                      {cmt.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Post Comment Input (Disabled if closed) */}
            {!isClosed ? (
              <form onSubmit={handleAddComment} data-testid="add-comment-form">
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Type a comment or update for this support issue..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={updating}
                    data-testid="comment-input"
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={updating || !commentText.trim()}
                    data-testid="comment-submit-btn"
                  >
                    <Send size={14} /> Post Comment
                  </button>
                </div>
              </form>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                Comments are disabled on closed tickets.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Workflow Controls & Audit Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* US 4: Agent Controls (Status & Priority) */}
          {(isAgent || isAdmin) && !isClosed && (
            <div className="glass-panel" style={{ padding: '1.75rem', borderTop: '4px solid #a855f7' }} data-testid="agent-controls-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Tag size={20} color="#a855f7" />
                <h3 style={{ fontSize: '1.15rem' }}>Agent Resolution Controls</h3>
              </div>

              <form onSubmit={handleAgentUpdate} data-testid="agent-update-form">
                <div className="form-group">
                  <label className="form-label">Ticket Status</label>
                  <select
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={updating}
                    data-testid="agent-status-select"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved (Ready for customer close)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority Level</label>
                  <select
                    className="form-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    disabled={updating}
                    data-testid="agent-priority-select"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
                  disabled={updating}
                  data-testid="agent-update-btn"
                >
                  Save Status & Priority
                </button>
              </form>
            </div>
          )}

          {/* US 5: Admin Assign Controls */}
          {isAdmin && !isClosed && (
            <div className="glass-panel" style={{ padding: '1.75rem', borderTop: '4px solid #f43f5e' }} data-testid="admin-assign-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <ShieldCheck size={20} color="#f43f5e" />
                <h3 style={{ fontSize: '1.15rem' }}>Admin Agent Assignment</h3>
              </div>

              <div className="form-group">
                <label className="form-label">Assign to Active Support Agent</label>
                <select
                  className="form-select"
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  disabled={assigning}
                  data-testid="admin-assign-select"
                >
                  <option value="">-- Select Active Support Agent --</option>
                  {agents.map((ag) => (
                    <option key={ag.email} value={ag.email}>
                      {ag.name} ({ag.email})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.75rem', background: 'var(--grad-rose)', color: 'white', border: 'none' }}
                onClick={handleAssignTicket}
                disabled={assigning || !selectedAgent || selectedAgent === ticket.assignedTo}
                data-testid="admin-assign-btn"
              >
                {assigning ? 'Assigning...' : 'Assign Ticket & Notify Agent'}
              </button>
            </div>
          )}

          {/* Current Assignee Card */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
              Current Assigned Agent
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc', fontWeight: 'bold' }}>
                <User size={20} />
              </div>
              <div>
                <span style={{ fontWeight: 600, display: 'block', color: 'var(--text-primary)' }} data-testid="assigned-agent-name">
                  {ticket.assignedToName || 'Unassigned Queue'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {ticket.assignedTo || 'Pending assignment by admin'}
                </span>
              </div>
            </div>
          </div>

          {/* US 4 Criteria 4 & US 5 Criteria 3 & US 6 Criteria 4: Audit History Timeline */}
          <div className="glass-panel" style={{ padding: '1.75rem' }} data-testid="audit-history-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <History size={20} color="#06b6d4" />
              <h3 style={{ fontSize: '1.15rem' }}>Immutable Audit History</h3>
            </div>

            <div className="timeline" data-testid="audit-history-timeline">
              {(ticket.auditHistory || []).map((item) => (
                <div key={item.id} className="timeline-item" data-testid={`audit-item-${item.id}`}>
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-action">{item.action}</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                      {item.details}
                    </p>
                    <div className="timeline-meta">
                      By {item.performedBy} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* US 6: Customer Close Ticket Modal */}
      {showCloseModal && (
        <div className="modal-overlay animate-fade-in" data-testid="close-ticket-modal">
          <div className="modal-content animate-scale-up" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f43f5e' }}>
                <CheckCircle2 size={24} />
                <h2 style={{ fontSize: '1.25rem' }}>Close & Archive Ticket</h2>
              </div>
              <button onClick={() => setShowCloseModal(false)} className="btn btn-secondary btn-sm" data-testid="close-modal-cancel-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCloseTicket} data-testid="close-ticket-form">
              <div className="modal-body">
                {closeError && (
                  <div className="alert alert-error" data-testid="close-error-banner">
                    <AlertCircle size={18} />
                    <span>{closeError}</span>
                  </div>
                )}

                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                  Please confirm that your issue has been satisfactorily resolved. Once closed, this ticket will become read-only.
                </p>

                {/* US 6 Criteria 2: Closure reason is mandatory */}
                <div className="form-group">
                  <label className="form-label" htmlFor="closure-reason-input">
                    Mandatory Closure Reason <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <textarea
                    id="closure-reason-input"
                    className="form-textarea"
                    rows={4}
                    placeholder="e.g., Issue resolved after clearing browser cache and re-logging in..."
                    value={closureReason}
                    onChange={(e) => setClosureReason(e.target.value)}
                    disabled={closing}
                    data-testid="close-reason-input"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCloseModal(false)}
                  disabled={closing}
                  data-testid="close-modal-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={closing}
                  data-testid="close-submit-btn"
                >
                  {closing ? 'Archiving...' : 'Confirm Closure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
