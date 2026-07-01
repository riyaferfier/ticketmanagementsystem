import React, { useState } from 'react';
import { X, PlusCircle, Paperclip, CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react';
import { createTicketApi } from '../api';

export default function CreateTicketModal({ onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technical');
  const [priority, setPriority] = useState('Medium');
  const [attachmentName, setAttachmentName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachmentName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Criteria 2: Mandatory Fields: Title, Description, Category
    if (!title.trim() || !description.trim() || !category) {
      setError('Title, Description, and Category are mandatory fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await createTicketApi({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        attachment: attachmentName || null
      });

      // Criteria 5: Success message displayed after creation
      setSuccessMsg(`Ticket ${res.ticket.id} created successfully! Default status: "${res.ticket.status}".`);
      setTimeout(() => {
        onSuccess(res.ticket);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to create support ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" data-testid="create-ticket-modal">
      <div className="modal-content animate-scale-up" style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '10px', color: '#6366f1' }}>
              <PlusCircle size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem' }}>Create New Support Ticket</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Submit an inquiry for our technical or billing teams</span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" data-testid="create-close-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} data-testid="create-ticket-form">
          <div className="modal-body">
            {error && (
              <div className="alert alert-error animate-fade-in" data-testid="create-error-banner">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="alert alert-success animate-fade-in" data-testid="create-success-banner">
                <CheckCircle2 size={18} />
                <span style={{ fontWeight: 600 }}>{successMsg}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="title-input">Ticket Title / Summary <span style={{ color: '#f43f5e' }}>*</span></label>
              <input
                id="title-input"
                type="text"
                className="form-input"
                placeholder="Briefly summarize your issue or request..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading || !!successMsg}
                data-testid="create-title-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="category-select">Category <span style={{ color: '#f43f5e' }}>*</span></label>
                <select
                  id="category-select"
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading || !!successMsg}
                  data-testid="create-category-select"
                >
                  <option value="Technical">Technical</option>
                  <option value="Billing">Billing</option>
                  <option value="Account">Account</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="General Inquiry">General Inquiry</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="priority-select">Priority Level</label>
                <select
                  id="priority-select"
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  disabled={loading || !!successMsg}
                  data-testid="create-priority-select"
                >
                  <option value="Low">Low - Minor bug or question</option>
                  <option value="Medium">Medium - Normal operational impact</option>
                  <option value="High">High - Significant feature degradation</option>
                  <option value="Urgent">Urgent - System outage or critical blocker</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description-input">Detailed Description <span style={{ color: '#f43f5e' }}>*</span></label>
              <textarea
                id="description-input"
                className="form-textarea"
                rows={5}
                placeholder="Provide steps to reproduce, error messages, or detailed requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading || !!successMsg}
                data-testid="create-description-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Simulated File Attachment (Optional)</label>
              <label
                htmlFor="file-upload"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1.5rem',
                  border: '2px dashed rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  background: 'rgba(15, 20, 36, 0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center'
                }}
                data-testid="create-attachment-zone"
              >
                <UploadCloud size={28} color="#06b6d4" style={{ marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {attachmentName ? `Attached: ${attachmentName}` : 'Click to select screenshot or log file'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Supports PNG, JPG, PDF, TXT up to 10MB
                </span>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  disabled={loading || !!successMsg}
                  data-testid="create-attachment-input"
                />
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading || !!successMsg}
              data-testid="create-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !!successMsg}
              data-testid="create-submit-btn"
            >
              {loading ? 'Submitting...' : 'Submit Support Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
