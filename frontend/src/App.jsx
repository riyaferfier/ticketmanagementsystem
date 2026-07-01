import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TicketListPage from './pages/TicketListPage';
import TicketDetailPage from './pages/TicketDetailPage';
import AdminPortalPage from './pages/AdminPortalPage';
import CreateTicketModal from './components/CreateTicketModal';
import { getMeApi } from './api';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, tickets, admin
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkSavedSession();
  }, []);

  async function checkSavedSession() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const data = await getMeApi();
        setUser(data.user);
      } catch (err) {
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setCheckingAuth(false);
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setSelectedTicketId(null);
    setActiveTab('dashboard');
  };

  const handleSelectTicket = (id) => {
    setSelectedTicketId(id);
  };

  const handleBackToDirectory = () => {
    setSelectedTicketId(null);
  };

  const handleTicketCreated = (newTicket) => {
    setShowCreateModal(false);
    setSelectedTicketId(newTicket.id);
  };

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0d17', color: '#94a3b8' }}>
        <p>Initializing TicketSuite...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  return (
    <div className="app-container" data-testid="app-container">
      <div className="main-content">
        <Navbar
          user={user}
          onLogout={handleLogout}
          activeTab={selectedTicketId ? '' : activeTab}
          setActiveTab={(tab) => {
            setSelectedTicketId(null);
            setActiveTab(tab);
          }}
        />

        <main style={{ flex: 1 }}>
          {selectedTicketId ? (
            <TicketDetailPage
              ticketId={selectedTicketId}
              user={user}
              onBack={handleBackToDirectory}
            />
          ) : activeTab === 'dashboard' ? (
            <DashboardPage
              user={user}
              onNavigateToTickets={() => setActiveTab('tickets')}
              onOpenCreateModal={() => setShowCreateModal(true)}
              onSelectTicket={handleSelectTicket}
            />
          ) : activeTab === 'tickets' ? (
            <TicketListPage
              user={user}
              onSelectTicket={handleSelectTicket}
              onOpenCreateModal={() => setShowCreateModal(true)}
            />
          ) : activeTab === 'admin' && user.role === 'admin' ? (
            <AdminPortalPage user={user} />
          ) : (
            <DashboardPage
              user={user}
              onNavigateToTickets={() => setActiveTab('tickets')}
              onOpenCreateModal={() => setShowCreateModal(true)}
              onSelectTicket={handleSelectTicket}
            />
          )}
        </main>

        {showCreateModal && (
          <CreateTicketModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleTicketCreated}
          />
        )}
      </div>
    </div>
  );
}
