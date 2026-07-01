import React, { useState, useEffect } from 'react';
import { Ticket, PlusCircle, Clock, CheckCircle2, XCircle, ArrowRight, ShieldAlert, Activity } from 'lucide-react';
import { getTicketsApi, getReportsApi } from '../api';

export default function DashboardPage({ user, onNavigateToTickets, onOpenCreateModal, onSelectTicket }) {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const ticketsRes = await getTicketsApi();
      const loadedTickets = ticketsRes.tickets || [];
      setTickets(loadedTickets);

      if (user.role === 'admin') {
        const repRes = await getReportsApi();
        setStats(repRes.stats || { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });
      } else {
        // Calculate locally for customer or agent
        const open = loadedTickets.filter(t => t.status === 'Open').length;
        const inProgress = loadedTickets.filter(t => t.status === 'In Progress').length;
        const resolved = loadedTickets.filter(t => t.status === 'Resolved').length;
        const closed = loadedTickets.filter(t => t.status === 'Closed').length;
        setStats({ total: loadedTickets.length, open, inProgress, resolved, closed });
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  const recentTickets = tickets.slice(0, 5);

  return (
    <div className="page-wrapper" data-testid="dashboard-page">
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }} data-testid="dashboard-welcome-title">
            Welcome back, {user.name} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {user.role === 'customer' && 'Track your support issues, add attachments, and close resolved tickets.'}
            {user.role === 'agent' && 'Review your assigned queue, update ticket statuses, and assist customers.'}
            {user.role === 'admin' && 'Manage system users, assign support agents, and monitor performance reports.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          {user.role === 'customer' && (
            <button
              className="btn btn-primary"
              onClick={onOpenCreateModal}
              data-testid="dashboard-create-ticket-btn"
            >
              <PlusCircle size={18} />
              New Support Ticket
            </button>
          )}

          <button
            className="btn btn-secondary"
            onClick={() => onNavigateToTickets()}
            data-testid="dashboard-view-all-btn"
          >
            View All Tickets
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="stats-grid" data-testid="stats-grid">
        <div className="glass-panel stat-card open" data-testid="stat-card-open">
          <span className="stat-title">Open Issues</span>
          <span className="stat-value" style={{ color: '#34d399' }} data-testid="stat-open-value">{stats.open}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Waiting for triage</span>
        </div>

        <div className="glass-panel stat-card progress" data-testid="stat-card-progress">
          <span className="stat-title">In Progress</span>
          <span className="stat-value" style={{ color: '#fbbf24' }} data-testid="stat-progress-value">{stats.inProgress}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Agents actively working</span>
        </div>

        <div className="glass-panel stat-card resolved" data-testid="stat-card-resolved">
          <span className="stat-title">Resolved</span>
          <span className="stat-value" style={{ color: '#22d3ee' }} data-testid="stat-resolved-value">{stats.resolved}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ready for closure</span>
        </div>

        <div className="glass-panel stat-card closed" data-testid="stat-card-closed">
          <span className="stat-title">Archived / Closed</span>
          <span className="stat-value" style={{ color: '#94a3b8' }} data-testid="stat-closed-value">{stats.closed}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Completed & verified</span>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }} data-testid="recent-tickets-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="#6366f1" />
            <h2 style={{ fontSize: '1.25rem' }}>Recent Tickets & Updates</h2>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Showing top 5 latest items</span>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' }}>Loading dashboard data...</p>
        ) : recentTickets.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Ticket size={48} color="#64748b" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No support tickets found yet.</p>
            {user.role === 'customer' && (
              <button className="btn btn-primary" onClick={onOpenCreateModal}>
                <PlusCircle size={18} /> Create First Ticket
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table" data-testid="recent-tickets-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Title & Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Agent</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((ticket) => (
                  <tr key={ticket.id} data-testid={`ticket-row-${ticket.id}`}>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-heading)' }} data-testid={`ticket-id-${ticket.id}`}>
                      {ticket.id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                        {ticket.title}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {ticket.category}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-priority ${ticket.priority}`} data-testid={`priority-badge-${ticket.id}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-status ${ticket.status.replace(' ', '.')}`} data-testid={`status-badge-${ticket.id}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td style={{ color: ticket.assignedTo ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {ticket.assignedToName || 'Unassigned'}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onSelectTicket(ticket.id)}
                        data-testid={`view-ticket-btn-${ticket.id}`}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
