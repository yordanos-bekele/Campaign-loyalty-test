import { useEffect, useState } from 'react';
import {
  adminLogin,
  createHotel,
  getAdminCustomers,
  getAdminDashboard,
  getCurrentHotelStats,
  getSessionUser,
  getReadableError,
  hotelLogin,
  importCustomers,
  importHotels,
  logout,
} from '../services/api';

function StatCard({ label, value, accent, onClick, active = false }) {
  return (
    <article
      className={`stat-card stat-card--${accent}${onClick ? ' stat-card--interactive' : ''}${active ? ' stat-card--active' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      } : undefined}
    >
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

const emptyHotelForm = {
  name: '',
  location: '',
  password: '',
};

function Dashboard({ mode = 'hotel' }) {
  const [sessionUser, setSessionUser] = useState(null);
  const [hotelLoginForm, setHotelLoginForm] = useState(emptyHotelLogin);
  const [adminLoginForm, setAdminLoginForm] = useState(emptyAdminLogin);
  const [createHotelForm, setCreateHotelForm] = useState(emptyHotelForm);
  const [hotelStats, setHotelStats] = useState(null);
  const [adminDashboard, setAdminDashboard] = useState(null);
  const [adminCustomers, setAdminCustomers] = useState([]);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [customerImportResult, setCustomerImportResult] = useState(null);
  const [hotelImportResult, setHotelImportResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
    setSuccessMessage('');

    try {
      if (knownSession.role === 'hotel') {
        const stats = await getCurrentHotelStats();
        setHotelStats(stats);
        setAdminDashboard(null);
        setAdminCustomers([]);
      } else if (knownSession.role === 'admin') {
        const [dashboardResult, customersResult] = await Promise.allSettled([
          getAdminDashboard(),
          getAdminCustomers(),
        ]);

        if (dashboardResult.status !== 'fulfilled') {
          throw dashboardResult.reason;
        }

        setAdminDashboard(dashboardResult.value);
        setAdminCustomers(customersResult.status === 'fulfilled' ? customersResult.value : []);
        setHotelStats(null);

        if (customersResult.status !== 'fulfilled') {
          setError('Admin dashboard loaded, but customer analytics are not available from this backend yet.');
        }
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
      if (session && (mode === 'admin' ? session.role === 'admin' : session.role === 'hotel')) {
        await loadDashboardData(session);
      } else if (session) {
        setSessionUser(null);
      }
    };

    boot();
  }, [mode]);

  const handleHotelLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccessMessage('');

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
    setSuccessMessage('');

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
    setSuccessMessage('');

    try {
      await logout();
      setSessionUser(null);
      setHotelStats(null);
      setAdminDashboard(null);
      setAdminCustomers([]);
      setShowCustomerList(false);
      setCustomerImportResult(null);
      setHotelImportResult(null);
    } catch (requestError) {
      setError(getReadableError(requestError, 'Could not log out right now.'));
    } finally {
      setBusy(false);
    }
  };

  const handleHotelCreate = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccessMessage('');

    try {
      await createHotel(createHotelForm);
      setCreateHotelForm(emptyHotelForm);
      setSuccessMessage('Hotel registered successfully.');
      await loadDashboardData();
    } catch (requestError) {
      setError(getReadableError(requestError, 'Could not create hotel.'));
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (type, event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setBusy(true);
    setError('');
    setSuccessMessage('');

    try {
      if (type === 'customers') {
        const result = await importCustomers(file);
        setCustomerImportResult(result);
        setSuccessMessage('Customer Excel import completed.');
      } else {
        const result = await importHotels(file);
        setHotelImportResult(result);
        setSuccessMessage('Hotel Excel import completed.');
      }
      await loadDashboardData();
    } catch (requestError) {
      setError(getReadableError(requestError, 'Import failed.'));
    } finally {
      event.target.value = '';
      setBusy(false);
    }
  };

  const hotelView = mode === 'hotel' && sessionUser?.role === 'hotel';
  const adminView = mode === 'admin' && sessionUser?.role === 'admin';

  return (
    <section className="panel panel--wide role-panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{mode === 'admin' ? 'Admin Access' : 'Hotel Access'}</p>
          <h2>{mode === 'admin' ? 'Marathon Klassics admin control room' : 'Hotel loyalty dashboard'}</h2>
          <p className="section-copy">
            {mode === 'admin'
              ? 'Admin access is kept separate from the hotel experience. Use this space to manage hotels, loyal customers, and imports.'
              : 'Hotel teams only see their own campaign information, including scans, rewards, and suspicious activity.'}
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

      {!sessionUser && mode === 'hotel' && (
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

        </div>
      )}

      {!sessionUser && mode === 'admin' && (
        <div className="dashboard-grid">
          <article className="card">
            <h3>Admin login</h3>
            <p className="hint">Use the Marathon Klassics admin credentials to open company-wide controls.</p>
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
      {successMessage && <p className="message message--success">{successMessage}</p>}

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
              <StatCard
                label="Registered customers"
                value={adminDashboard?.registeredCustomerCount ?? '--'}
                accent="dark"
                onClick={() => setShowCustomerList((current) => !current)}
                active={showCustomerList}
              />
            </div>
            <p className="hint">Click the registered customers card to {showCustomerList ? 'hide' : 'view'} the full customer list with scan and reward totals.</p>
          </section>

          <section className="card">
            <h3>Register a hotel</h3>
            <p className="hint">Create one hotel manually, or use the import tools below for bulk onboarding.</p>
            <form className="form-stack" onSubmit={handleHotelCreate}>
              <label className="field">
                <span>Hotel name</span>
                <input
                  value={createHotelForm.name}
                  onChange={(event) => setCreateHotelForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ocean View Hotel"
                  required
                />
              </label>
              <label className="field">
                <span>Location</span>
                <input
                  value={createHotelForm.location}
                  onChange={(event) => setCreateHotelForm((current) => ({ ...current, location: event.target.value }))}
                  placeholder="Mogadishu"
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={createHotelForm.password}
                  onChange={(event) => setCreateHotelForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Hotel dashboard password"
                  required
                />
              </label>
              <button className="button button--primary" type="submit">
                {busy ? 'Saving...' : 'Register hotel'}
              </button>
            </form>
          </section>

          <section className="card">
            <h3>Bulk import from Excel</h3>
            <p className="hint">
              Customer sheet headers: <code>full name</code>, <code>phone number</code>, optional <code>email</code>, <code>device id</code>.
              Hotel sheet headers: <code>name</code>, <code>password</code>, optional <code>location</code>.
            </p>
            <div className="dashboard-grid">
              <label className="field">
                <span>Import loyal customers (.xlsx)</span>
                <input type="file" accept=".xlsx" onChange={(event) => handleImport('customers', event)} />
              </label>
              <label className="field">
                <span>Import hotels (.xlsx)</span>
                <input type="file" accept=".xlsx" onChange={(event) => handleImport('hotels', event)} />
              </label>
            </div>
            {customerImportResult && (
              <div className="info-box import-summary">
                <strong>Customer import</strong>
                <span>
                  Processed {customerImportResult.processedCount}, created {customerImportResult.createdCount},
                  updated {customerImportResult.updatedCount}, skipped {customerImportResult.skippedCount}
                </span>
                {customerImportResult.errors?.slice(0, 5).map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            )}
            {hotelImportResult && (
              <div className="info-box import-summary">
                <strong>Hotel import</strong>
                <span>
                  Processed {hotelImportResult.processedCount}, created {hotelImportResult.createdCount},
                  updated {hotelImportResult.updatedCount}, skipped {hotelImportResult.skippedCount}
                </span>
                {hotelImportResult.errors?.slice(0, 5).map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            )}
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

          <section className="card">
            <div className="section-title-row">
              <div>
                <h3>Registered loyal customers</h3>
                <p className="hint">Admin-only view of each customer’s reward count and valid scan history.</p>
              </div>
              <button className="button button--secondary" type="button" onClick={() => setShowCustomerList((current) => !current)}>
                {showCustomerList ? 'Hide list' : 'Show list'}
              </button>
            </div>
            {showCustomerList ? (
              adminCustomers.length ? (
                <div className="customer-summary-list">
                  {adminCustomers.map((customer) => (
                    <article className="customer-summary-card" key={customer.id}>
                      <div className="customer-summary-card__identity">
                        <div>
                          <strong>{customer.fullName}</strong>
                          <span>{customer.phoneNumber}</span>
                          <span>{customer.email || 'No email provided'}</span>
                        </div>
                        <code>#{customer.id}</code>
                      </div>
                      <div className="customer-summary-card__metrics">
                        <div>
                          <span>Rewards earned</span>
                          <strong>{customer.rewardCount}</strong>
                        </div>
                        <div>
                          <span>Valid scans</span>
                          <strong>{customer.validScanCount}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="hint">No loyal customers have registered yet.</p>
              )
            ) : (
              <p className="hint">Customer analytics are hidden until you open the registered customers card above.</p>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

export default Dashboard;
