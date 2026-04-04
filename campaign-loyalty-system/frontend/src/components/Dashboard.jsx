import { useEffect, useState } from 'react';
import {
  adminLogin,
  getAdminDashboard,
  getCurrentHotelStats,
  getSessionUser,
  getReadableError,
  hotelLogin,
  logout,
} from '../services/api';

function StatCard({ label, value, accent }) {
  return (
    <article className={`stat-card stat-card--${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

const emptyHotelLogin = {
  hotelName: '',
  password: '',
};

const emptyAdminLogin = {
  username: '',
  password: '',
};

function Dashboard() {
  const [sessionUser, setSessionUser] = useState(null);
  const [hotelLoginForm, setHotelLoginForm] = useState(emptyHotelLogin);
  const [adminLoginForm, setAdminLoginForm] = useState(emptyAdminLogin);
  const [hotelStats, setHotelStats] = useState(null);
  const [adminDashboard, setAdminDashboard] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadCurrentSession = async () => {
    try {
      const session = await getSessionUser();
      setSessionUser(session);
      return session;
    } catch {
      setSessionUser(null);
      return null;
    }
  };

  const loadDashboardData = async (knownSession = sessionUser) => {
    if (!knownSession) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      if (knownSession.role === 'hotel') {
        const stats = await getCurrentHotelStats();
        setHotelStats(stats);
        setAdminDashboard(null);
      } else if (knownSession.role === 'admin') {
        const dashboard = await getAdminDashboard();
        setAdminDashboard(dashboard);
        setHotelStats(null);
      }
    } catch (requestError) {
      setError(getReadableError(requestError, 'Could not load dashboard data right now.'));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const boot = async () => {
      const session = await loadCurrentSession();
      if (session) {
        await loadDashboardData(session);
      }
    };

    boot();
  }, []);

  const handleHotelLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const session = await hotelLogin(hotelLoginForm);
      setSessionUser(session);
      setHotelLoginForm(emptyHotelLogin);
      await loadDashboardData(session);
    } catch (requestError) {
      setError(getReadableError(requestError, 'Hotel login failed.'));
    } finally {
      setBusy(false);
    }
  };

  const handleAdminLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const session = await adminLogin(adminLoginForm);
      setSessionUser(session);
      setAdminLoginForm(emptyAdminLogin);
      await loadDashboardData(session);
    } catch (requestError) {
      setError(getReadableError(requestError, 'Admin login failed.'));
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    setError('');

    try {
      await logout();
      setSessionUser(null);
      setHotelStats(null);
      setAdminDashboard(null);
    } catch (requestError) {
      setError(getReadableError(requestError, 'Could not log out right now.'));
    } finally {
      setBusy(false);
    }
  };

  const hotelView = sessionUser?.role === 'hotel';
  const adminView = sessionUser?.role === 'admin';

  return (
    <section className="panel panel--wide">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Dashboard access</p>
          <h2>Separate views for hotels and campaign admin</h2>
          <p className="section-copy">
            Hotel teams only see their own campaign information. The admin account can review the full campaign and every registered hotel.
          </p>
        </div>
        {sessionUser && (
          <div className="button-group">
            <button className="button button--secondary" onClick={() => loadDashboardData()}>
              {busy ? 'Refreshing...' : 'Refresh'}
            </button>
            <button className="button button--ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>

      {!sessionUser && (
        <div className="dashboard-grid">
          <article className="card">
            <h3>Hotel login</h3>
            <p className="hint">Sign in using your hotel name and password to see only your hotel campaign dashboard.</p>
            <form className="form-stack" onSubmit={handleHotelLogin}>
              <label className="field">
                <span>Hotel name</span>
                <input
                  value={hotelLoginForm.hotelName}
                  onChange={(event) => setHotelLoginForm((current) => ({ ...current, hotelName: event.target.value }))}
                  placeholder="Ocean View Hotel"
                  required
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={hotelLoginForm.password}
                  onChange={(event) => setHotelLoginForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Enter hotel password"
                  required
                />
              </label>
              <button className="button button--primary" type="submit">
                {busy ? 'Signing in...' : 'Open hotel dashboard'}
              </button>
            </form>
          </article>

          <article className="card">
            <h3>Admin login</h3>
            <p className="hint">Use the admin credentials from the backend config to review all hotels and the full campaign.</p>
            <form className="form-stack" onSubmit={handleAdminLogin}>
              <label className="field">
                <span>Username</span>
                <input
                  value={adminLoginForm.username}
                  onChange={(event) => setAdminLoginForm((current) => ({ ...current, username: event.target.value }))}
                  placeholder="admin"
                  required
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={adminLoginForm.password}
                  onChange={(event) => setAdminLoginForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Enter admin password"
                  required
                />
              </label>
              <button className="button button--primary" type="submit">
                {busy ? 'Signing in...' : 'Open admin dashboard'}
              </button>
            </form>
          </article>
        </div>
      )}

      {error && <p className="message message--error">{error}</p>}

      {hotelView && (
        <div className="dashboard-grid">
          <section className="card">
            <div className="info-box">
              <strong>{sessionUser.displayName}</strong>
              <span>Hotel account</span>
            </div>
            <div className="stats-grid">
              <StatCard label="Scans today" value={hotelStats?.scansToday ?? '--'} accent="warm" />
              <StatCard label="Rewards given" value={hotelStats?.rewardsGiven ?? '--'} accent="green" />
              <StatCard label="Suspicious scans" value={hotelStats?.suspiciousScans ?? '--'} accent="red" />
            </div>
          </section>
        </div>
      )}

      {adminView && (
        <div className="dashboard-grid">
          <section className="card">
            <div className="info-box">
              <strong>{sessionUser.displayName}</strong>
              <span>Admin account</span>
            </div>
            <div className="stats-grid">
              <StatCard label="Total scans today" value={adminDashboard?.overallStats?.totalScansToday ?? '--'} accent="warm" />
              <StatCard label="Total rewards" value={adminDashboard?.overallStats?.totalRewardsGiven ?? '--'} accent="green" />
              <StatCard label="Total suspicious" value={adminDashboard?.overallStats?.totalSuspiciousScans ?? '--'} accent="red" />
            </div>
          </section>

          <section className="card">
            <h3>Registered hotels</h3>
            <div className="hotel-list">
              {adminDashboard?.hotels?.length ? adminDashboard.hotels.map((hotel) => (
                <article className="hotel-list__item" key={hotel.id}>
                  <div>
                    <strong>{hotel.name}</strong>
                    <span>{hotel.location || 'Location not provided'}</span>
                  </div>
                  <code>#{hotel.id}</code>
                </article>
              )) : (
                <p className="hint">No hotels have been registered yet.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export default Dashboard;
