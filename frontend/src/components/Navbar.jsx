import React, { useState, useEffect } from 'react';
import { Ticket, Bell, LogOut, User, CheckCircle2 } from 'lucide-react';
import { getNotificationsApi } from '../api';

export default function Navbar({ user, onLogout, activeTab, setActiveTab }) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  async function loadNotifications() {
    try {
      const data = await getNotificationsApi();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="navbar" data-testid="navbar">
      <div className="navbar-brand">
        <Ticket className="text-indigo-400" size={28} color="#6366f1" />
        <span data-testid="app-title">TicketSuite Pro</span>
      </div>

      {user && (
        <div className="navbar-nav">
          <button
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            data-testid="nav-dashboard"
          >
            Dashboard
          </button>
          
          <button
            className={`nav-link ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
            data-testid="nav-tickets"
          >
            Tickets
          </button>

          {user.role === 'admin' && (
            <button
              className={`nav-link ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
              data-testid="nav-admin"
            >
              Admin Portal
            </button>
          )}

          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowNotifs(!showNotifs)}
              data-testid="notif-bell"
              style={{ position: 'relative', padding: '0.5rem' }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  data-testid="notif-badge"
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#f43f5e',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '120%',
                  width: '320px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  padding: '1rem',
                  zIndex: 100,
                  background: '#0f1424',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.7)'
                }}
                data-testid="notif-dropdown"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>Notifications</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{notifications.length} total</span>
                </div>

                {notifications.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>No new notifications</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      style={{
                        padding: '0.75rem',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        marginBottom: '0.5rem',
                        fontSize: '0.85rem',
                        borderLeft: '3px solid #6366f1'
                      }}
                      data-testid={`notif-item-${notif.id}`}
                    >
                      <p style={{ color: '#f8fafc', marginBottom: '0.25rem' }}>{notif.message}</p>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem', paddingLeft: '1rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }} data-testid="user-name">
                {user.name}
              </span>
              <span className={`role-badge ${user.role}`} data-testid="user-role-badge">
                {user.role}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="btn btn-secondary btn-sm"
              title="Logout"
              data-testid="logout-btn"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
