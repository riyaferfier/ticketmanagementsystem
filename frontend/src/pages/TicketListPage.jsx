import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowUpDown, PlusCircle, Ticket, Eye, Paperclip, CheckCircle } from 'lucide-react';
import { getTicketsApi } from '../api';

export default function TicketListPage({ user, onSelectTicket, onOpenCreateModal }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Search states (US 3)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadTickets();
  }, [user]);

  async function loadTickets() {
    setLoading(true);
    try {
      const res = await getTicketsApi();
      setTickets(res.tickets || []);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  }

  // Apply search, filter, and sort in frontend or via API (we can do instant client-side filtering for ultra fast UI reactivity)
  const filteredTickets = tickets.filter(ticket => {
    // Search by ID or title/description
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      ticket.id.toLowerCase().includes(q) || 
      ticket.title.toLowerCase().includes(q) ||
      ticket.description.toLowerCase().includes(q);

    // Status filter
    const matchesStatus = statusFilter === 'All' || ticket.status.toLowerCase() === statusFilter.toLowerCase();

    // Priority filter
    const matchesPriority = priorityFilter === 'All' || ticket.priority.toLowerCase() === priorityFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPriority;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    if (sortBy === 'oldest') {
      return dateA - dateB;
    }
    return dateB - dateA;
  });

  return (
    <div className="page-wrapper" data-testid="ticket-list-page">
      {/* Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Support Tickets Directory</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Search, filter, and sort through support inquiries in real-time.
          </p>
        </div>

        {user.role === 'customer' && (
          <button
            className="btn btn-primary"
            onClick={onOpenCreateModal}
            data-testid="list-create-ticket-btn"
          >
            <PlusCircle size={18} />
            Create Support Ticket
          </button>
        )}
      </div>

      {/* Filter & Search Toolbar (US 3) */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem' }} data-testid="filter-toolbar">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by ID (e.g. TCK-1001) or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
              data-testid="search-input"
            />
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} color="#6366f1" />
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              data-testid="status-filter"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed / Archived</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} color="#ec4899" />
            <select
              className="form-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              data-testid="priority-filter"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Sort By Created Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowUpDown size={18} color="#06b6d4" />
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              data-testid="sort-filter"
            >
              <option value="newest">Sort by Date: Newest First</option>
              <option value="oldest">Sort by Date: Oldest First</option>
            </select>
          </div>

        </div>
      </div>

      {/* Tickets List Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }} data-testid="results-count">
            Showing {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={loadTickets} data-testid="refresh-list-btn">
            Refresh Directory
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)', padding: '3rem', textAlign: 'center' }}>Loading support tickets...</p>
        ) : filteredTickets.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <Ticket size={48} color="#64748b" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>No tickets match your filter criteria.</p>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Try clearing your search keywords or resetting the status/priority dropdowns.</p>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setSearchQuery(''); setStatusFilter('All'); setPriorityFilter('All'); }}
              data-testid="clear-filters-btn"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table" data-testid="tickets-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Title & Description</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Assigned Agent</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} data-testid={`ticket-list-row-${ticket.id}`}>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#8b5cf6' }} data-testid={`list-id-${ticket.id}`}>
                      {ticket.id}
                    </td>
                    <td style={{ maxWidth: '300px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {ticket.title}
                        {ticket.attachment && <Paperclip size={14} color="#06b6d4" title="Has attachment" />}
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ticket.description}
                      </p>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.06)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
                        {ticket.category}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-priority ${ticket.priority}`} data-testid={`list-priority-${ticket.id}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-status ${ticket.status.replace(' ', '.')}`} data-testid={`list-status-${ticket.id}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {ticket.createdByName || ticket.createdBy}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: ticket.assignedTo ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {ticket.assignedToName || 'Unassigned'}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onSelectTicket(ticket.id)}
                        data-testid={`list-view-btn-${ticket.id}`}
                      >
                        <Eye size={14} /> View
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
