import { useEffect, useState, useMemo } from 'react';
import QrDisplay from './QrDisplay';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  adminLogin,
  createHotel,
  getAdminCustomers,
  getAdminDashboard,
  getCurrentHotelStats,
  getSessionUser,
  getReadableError,
  getHotelStats,
  getDetailedReport,
  getHotelDetailedReport,
  hotelLogin,
  importCustomers,
  importHotels,
  logout,
} from '../services/api';
import marathonLogo from '../assets/Marathon logo.png';
import adminHeroBanner from '../assets/admin_hero_banner.png';
import BrandFooter from './BrandFooter';
import HotelLoginPage from './HotelLoginPage';

function StatCard({ label, value, accent, onClick, active = false }) {
  const accentBorders = {
    warm: 'border-t-4 border-t-[#deb355]',
    green: 'border-t-4 border-t-emerald-600',
    red: 'border-t-4 border-t-[#c73f43]',
    dark: 'border-t-4 border-t-zinc-900',
  };
  
  const baseClasses = `p-5 sm:p-6 rounded-none border border-zinc-200 bg-white shadow-xs transition-all ${
    accentBorders[accent] || 'border-t-4 border-t-zinc-400'
  } ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-zinc-300' : ''} ${
    active ? 'ring-2 ring-zinc-900 ring-offset-2' : ''
  }`;

  return (
    <article
      className={baseClasses}
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
      <span className="block text-xs font-bold font-condensed uppercase tracking-wider text-zinc-500 mb-1.5">{label}</span>
      <strong className="block text-3xl sm:text-4xl font-black font-condensed tracking-tight text-zinc-950">{value}</strong>
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
  const [adminQrHotelId, setAdminQrHotelId] = useState('1');
  const [customerImportResult, setCustomerImportResult] = useState(null);
  const [hotelImportResult, setHotelImportResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedHotelForStats, setSelectedHotelForStats] = useState(null);
  const [selectedHotelStatsData, setSelectedHotelStatsData] = useState(null);
  const [loadingHotelStats, setLoadingHotelStats] = useState(false);
  const [showDetailedReportModal, setShowDetailedReportModal] = useState(false);
  const [detailedReportData, setDetailedReportData] = useState([]);
  const [loadingDetailedReport, setLoadingDetailedReport] = useState(false);
  const [reportFilterDate, setReportFilterDate] = useState('');
  const [reportFilterHotel, setReportFilterHotel] = useState('');
  const [reportFilterHotelInput, setReportFilterHotelInput] = useState('');
  const [reportPage, setReportPage] = useState(1);

  const [showHotelDetailedReportModal, setShowHotelDetailedReportModal] = useState(false);
  const [hotelDetailedReportData, setHotelDetailedReportData] = useState([]);
  const [loadingHotelDetailedReport, setLoadingHotelDetailedReport] = useState(false);
  const [hotelReportFilterDate, setHotelReportFilterDate] = useState('');
  const [hotelReportPage, setHotelReportPage] = useState(1);

  useEffect(() => {
    const handler = setTimeout(() => {
      setReportFilterHotel(reportFilterHotelInput);
      setReportPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [reportFilterHotelInput]);

  const handleAuthError = (e) => {
    const errorMsg = getReadableError(e, '').toLowerCase();
    if (e?.response?.status === 401 || errorMsg.includes('login required') || errorMsg.includes('unauthorized')) {
      setSessionUser(null);
      setError('Your session has expired. Please log in again.');
      return true;
    }
    return false;
  };

  const handleOpenDetailedReport = async () => {
    setShowDetailedReportModal(true);
    setLoadingDetailedReport(true);
    try {
      const data = await getDetailedReport();
      setDetailedReportData(data);
    } catch (e) {
      console.error(e);
      if (handleAuthError(e)) {
        setShowDetailedReportModal(false);
      }
    } finally {
      setLoadingDetailedReport(false);
    }
  };

  const handleHotelClick = async (hotel) => {
    setSelectedHotelForStats(hotel);
    setLoadingHotelStats(true);
    setSelectedHotelStatsData(null);
    try {
      const stats = await getHotelStats(hotel.id);
      setSelectedHotelStatsData(stats);
    } catch (e) {
      console.error(e);
      if (handleAuthError(e)) {
        setSelectedHotelForStats(null);
      }
    } finally {
      setLoadingHotelStats(false);
    }
  };

  const handleOpenHotelDetailedReport = async () => {
    setShowHotelDetailedReportModal(true);
    setLoadingHotelDetailedReport(true);
    try {
      const data = await getHotelDetailedReport();
      setHotelDetailedReportData(data);
    } catch (e) {
      console.error(e);
      if (handleAuthError(e)) {
        setShowHotelDetailedReportModal(false);
      }
    } finally {
      setLoadingHotelDetailedReport(false);
    }
  };

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
    if (!knownSession) return;

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

        if (dashboardResult.status !== 'fulfilled') throw dashboardResult.reason;

        setAdminDashboard(dashboardResult.value);
        setAdminCustomers(customersResult.status === 'fulfilled' ? customersResult.value : []);
        setHotelStats(null);

        if (customersResult.status !== 'fulfilled') {
          setError('Admin dashboard loaded, but customer analytics are not available from this backend yet.');
        }
      }
    } catch (requestError) {
      if (!handleAuthError(requestError)) {
        setError(getReadableError(requestError, 'Could not load dashboard data right now.'));
      }
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
      if (!handleAuthError(requestError)) {
        setError(getReadableError(requestError, 'Could not create hotel.'));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (type, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
      if (!handleAuthError(requestError)) {
        setError(getReadableError(requestError, 'Import failed.'));
      }
    } finally {
      event.target.value = '';
      setBusy(false);
    }
  };

  const hotelView = mode === 'hotel' && sessionUser?.role === 'hotel';
  const adminView = mode === 'admin' && sessionUser?.role === 'admin';

  const filteredReportData = useMemo(() => {
    return detailedReportData.filter(row => {
      if (reportFilterDate && !row.date.startsWith(reportFilterDate)) return false;
      if (reportFilterHotel && !row.hotelName.toLowerCase().includes(reportFilterHotel.toLowerCase())) return false;
      return true;
    });
  }, [detailedReportData, reportFilterDate, reportFilterHotel]);
  
  const REPORT_PAGE_SIZE = 5;
  const totalReportPages = Math.max(1, Math.ceil(filteredReportData.length / REPORT_PAGE_SIZE));
  const paginatedReportData = filteredReportData.slice((reportPage - 1) * REPORT_PAGE_SIZE, reportPage * REPORT_PAGE_SIZE);

  const hotelFilteredReportData = useMemo(() => {
    return hotelDetailedReportData.filter(row => {
      if (hotelReportFilterDate && !row.date.startsWith(hotelReportFilterDate)) return false;
      return true;
    });
  }, [hotelDetailedReportData, hotelReportFilterDate]);
  
  const HOTEL_REPORT_PAGE_SIZE = 5;
  const hotelTotalReportPages = Math.max(1, Math.ceil(hotelFilteredReportData.length / HOTEL_REPORT_PAGE_SIZE));
  const hotelPaginatedReportData = hotelFilteredReportData.slice((hotelReportPage - 1) * HOTEL_REPORT_PAGE_SIZE, hotelReportPage * HOTEL_REPORT_PAGE_SIZE);

  if (!sessionUser && mode === 'admin') {
    return (
      <div className="w-full min-h-screen flex items-center justify-center py-4 sm:py-8 px-2 sm:px-4 bg-zinc-100">
        <div className="w-full max-w-5xl bg-white text-zinc-950 shadow-2xl border border-zinc-300 overflow-hidden flex flex-col">
          {/* Top Hero Section matching admin_login_page.jpg */}
          <div className="w-full relative overflow-hidden bg-white select-none">
            <img
              src={adminHeroBanner}
              alt="Marathon Spirits Admin Control Room - Admin access is kept separate from the hotel experience. Use this space to manage hotels, loyal customers, and imports."
              className="w-full h-auto block"
              decoding="async"
              fetchpriority="high"
            />
          </div>

          {/* Admin Login Form Section */}
          <section className="w-full bg-[#f2f2f2] px-4 sm:px-8 py-10 sm:py-14 text-center text-zinc-950">
            <div className="max-w-[590px] mx-auto w-full">
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black uppercase tracking-tight text-black mb-2 font-condensed">
                Admin Login
              </h1>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-800 mb-8 sm:mb-9 leading-snug">
                Use the Marathon Spirits admin credentials to open<br className="hidden sm:inline" /> company-wide controls.
              </p>

              {error && (
                <Alert variant="destructive" className="rounded-none mb-6 text-left bg-red-50 text-red-900 border border-red-300">
                  <AlertDescription className="font-semibold">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left">
                  <div>
                    <Label htmlFor="adminUsername" className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5 block">
                      Username
                    </Label>
                    <Input
                      id="adminUsername"
                      value={adminLoginForm.username}
                      onChange={(e) => setAdminLoginForm((c) => ({ ...c, username: e.target.value }))}
                      required
                      className="h-11 bg-white border border-zinc-400 text-zinc-950 rounded-none focus-visible:ring-1 focus-visible:ring-zinc-900 focus-visible:border-zinc-900 font-medium"
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminPassword" className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5 block">
                      Password
                    </Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={adminLoginForm.password}
                      onChange={(e) => setAdminLoginForm((c) => ({ ...c, password: e.target.value }))}
                      required
                      className="h-11 bg-white border border-zinc-400 text-zinc-950 rounded-none focus-visible:ring-1 focus-visible:ring-zinc-900 focus-visible:border-zinc-900 font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-center pt-1">
                  <Button
                    type="submit"
                    disabled={busy}
                    className="bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 font-bold uppercase tracking-wider text-xs px-6 py-2 h-9 rounded-none shadow-none transition-colors"
                  >
                    {busy ? 'Signing in...' : 'Open Admin Dashboard'}
                  </Button>
                </div>
              </form>
            </div>
          </section>

          {/* Footer flush with bottom matching admin_login_page.jpg */}
          <BrandFooter className="mt-0 border-t-0" />
        </div>
      </div>
    );
  }

  if (!sessionUser && mode === 'hotel') {
    return (
      <HotelLoginPage
        hotelLoginForm={hotelLoginForm}
        setHotelLoginForm={setHotelLoginForm}
        handleHotelLogin={handleHotelLogin}
        busy={busy}
        error={error}
      />
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-between py-4 sm:py-8 px-2 sm:px-4 bg-zinc-100 text-zinc-950">
      <div className="w-full max-w-5xl bg-white text-zinc-950 shadow-2xl border border-zinc-300 overflow-hidden flex flex-col">
        {/* Top Hero Section matching Admin Login Page */}
        {mode === 'admin' ? (
          <div className="w-full relative overflow-hidden bg-white select-none border-b border-zinc-300">
            <img
              src={adminHeroBanner}
              alt="Marathon Spirits Admin Control Room - Admin access is kept separate from the hotel experience. Use this space to manage hotels, loyal customers, and imports."
              className="w-full h-auto block"
              decoding="async"
              fetchpriority="high"
            />
          </div>
        ) : (
          <div className="w-full bg-black text-white px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800">
            <div className="flex items-center gap-4">
              <img src={marathonLogo} alt="Marathon Spirits" className="h-8 w-auto object-contain logo-white" decoding="async" />
              <div className="h-6 w-px bg-zinc-700" />
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#deb355] block font-condensed">
                  Hotel Partner Portal
                </span>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white font-condensed">
                  {sessionUser ? sessionUser.displayName : 'Hotel Partner'}
                </h2>
              </div>
            </div>
            {sessionUser && (
              <div className="flex gap-2 shrink-0 items-center">
                <Button
                  variant="outline"
                  className="bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 font-condensed font-bold uppercase tracking-wider text-xs px-4 py-2 h-9 rounded-none shadow-none"
                  onClick={() => loadDashboardData()}
                  disabled={busy}
                >
                  {busy ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button
                  variant="outline"
                  className="bg-red-950/40 hover:bg-red-900 text-red-300 border border-red-800/60 font-condensed font-bold uppercase tracking-wider text-xs px-4 py-2 h-9 rounded-none shadow-none"
                  onClick={handleLogout}
                  disabled={busy}
                >
                  Logout
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Admin Subheader / Control Strip */}
        {mode === 'admin' && (
          <div className="w-full bg-[#f2f2f2] border-b border-zinc-300 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-condensed">
                    Marathon Spirits Control Room
                  </span>
                  <Badge variant="outline" className="bg-zinc-900 text-white border-transparent rounded-none uppercase text-[10px] font-condensed px-2 py-0.5 tracking-wider">
                    Admin Privileged
                  </Badge>
                </div>
                <span className="text-base sm:text-lg font-black uppercase tracking-tight text-black font-condensed">
                  {sessionUser ? sessionUser.displayName : 'Authorized Admin'}
                </span>
              </div>
            </div>
            {sessionUser && (
              <div className="flex gap-2 shrink-0 items-center">
                <Button
                  variant="outline"
                  className="bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 font-condensed font-bold uppercase tracking-wider text-xs px-4 py-2 h-9 rounded-none shadow-none transition-colors"
                  onClick={() => loadDashboardData()}
                  disabled={busy}
                >
                  {busy ? 'Refreshing...' : 'Refresh Data'}
                </Button>
                <Button
                  variant="outline"
                  className="bg-red-50 hover:bg-red-100 text-[#c73f43] border border-red-200 font-condensed font-bold uppercase tracking-wider text-xs px-4 py-2 h-9 rounded-none shadow-none transition-colors"
                  onClick={handleLogout}
                  disabled={busy}
                >
                  Logout
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Dashboard Body Content */}
        <div className="p-4 sm:p-8 space-y-6 bg-zinc-50/50 flex-1">
          {error && (
            <Alert variant="destructive" className="rounded-none bg-red-50 text-red-900 border border-red-300">
              <AlertDescription className="font-semibold font-condensed">{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="rounded-none bg-emerald-50 text-emerald-900 border border-emerald-300">
              <AlertDescription className="font-semibold font-condensed">{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Hotel View */}
          {hotelView && (
            <div className="grid gap-6">
              <div className="bg-white border border-zinc-300 shadow-xs overflow-hidden flex flex-col">
                <div className="bg-[#f2f2f2] border-b border-zinc-300 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-condensed font-black text-base uppercase tracking-tight text-black">
                      {sessionUser.displayName} Overview
                    </h3>
                    <p className="text-xs font-condensed text-zinc-600">
                      Live campaign performance and daily scan tracking.
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Button
                      variant="outline"
                      className="bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 font-condensed font-bold uppercase tracking-wider text-xs px-4 py-1.5 h-8 rounded-none shadow-none"
                      onClick={handleOpenHotelDetailedReport}
                    >
                      Show Detailed Report
                    </Button>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 rounded-none uppercase font-condensed px-3 py-1 text-xs">
                      Active session
                    </Badge>
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <StatCard label="Scans today" value={hotelStats?.scansToday ?? '--'} accent="warm" />
                    <StatCard label="Rewards given" value={hotelStats?.rewardsGiven ?? '--'} accent="green" />
                    <StatCard label="Suspicious scans" value={hotelStats?.suspiciousScans ?? '--'} accent="red" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin View */}
          {adminView && (
            <div className="grid gap-6">
              {/* Overview Metric Strip */}
              <div className="bg-white border border-zinc-300 shadow-xs overflow-hidden flex flex-col">
                <div className="bg-[#f2f2f2] border-b border-zinc-300 px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black uppercase tracking-tight text-black font-condensed">
                      Company-wide Overview
                    </h2>
                    <p className="text-xs font-condensed text-zinc-600">
                      Real-time scan verification and loyalty reward metrics across all partner venues.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 font-condensed hidden sm:inline">
                    Live Sync
                  </span>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="grid sm:grid-cols-4 gap-4 mb-3">
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
                  <p className="text-xs text-zinc-500 font-condensed uppercase tracking-wider">
                    Click the registered customers card to {showCustomerList ? 'hide' : 'view'} the full customer roster.
                  </p>
                </div>
              </div>

              {/* Two Column Section: Register Hotel + QR/Import */}
              <div className="grid md:grid-cols-[1fr_1.5fr] gap-6 items-start">
                {/* Register a Hotel */}
                <div className="bg-white border border-zinc-300 shadow-xs overflow-hidden flex flex-col">
                  <div className="bg-[#f2f2f2] border-b border-zinc-300 px-5 py-3.5">
                    <h3 className="font-condensed font-black text-base uppercase tracking-tight text-black">
                      Register a Hotel
                    </h3>
                    <p className="text-xs font-condensed text-zinc-600">
                      Create one hotel manually, or use the import tools below.
                    </p>
                  </div>
                  <form className="p-5 sm:p-6 space-y-4" onSubmit={handleHotelCreate}>
                    <div>
                      <Label htmlFor="newHotelName" className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5 block font-condensed">
                        Hotel Name
                      </Label>
                      <Input
                        id="newHotelName"
                        value={createHotelForm.name}
                        onChange={(event) => setCreateHotelForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder="e.g. Ocean View Hotel"
                        required
                        className="h-10 bg-white border border-zinc-300 rounded-none text-zinc-950 focus-visible:ring-1 focus-visible:ring-zinc-900 font-medium text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newHotelLocation" className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5 block font-condensed">
                        Location
                      </Label>
                      <Input
                        id="newHotelLocation"
                        value={createHotelForm.location}
                        onChange={(event) => setCreateHotelForm((current) => ({ ...current, location: event.target.value }))}
                        placeholder="e.g. Mogadishu"
                        className="h-10 bg-white border border-zinc-300 rounded-none text-zinc-950 focus-visible:ring-1 focus-visible:ring-zinc-900 font-medium text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newHotelPassword" className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5 block font-condensed">
                        Password
                      </Label>
                      <Input
                        id="newHotelPassword"
                        type="password"
                        value={createHotelForm.password}
                        onChange={(event) => setCreateHotelForm((current) => ({ ...current, password: event.target.value }))}
                        placeholder="Dashboard access password"
                        required
                        className="h-10 bg-white border border-zinc-300 rounded-none text-zinc-950 focus-visible:ring-1 focus-visible:ring-zinc-900 font-medium text-sm"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={busy}
                      className="w-full bg-[#deb355] hover:bg-[#c98827] text-white font-condensed font-bold uppercase tracking-wider text-xs py-2.5 h-10 rounded-none shadow-none transition-colors"
                    >
                      {busy ? 'Saving...' : 'Register Hotel'}
                    </Button>
                  </form>
                </div>

                {/* Right Column: QR Code + Excel Bulk Import */}
                <div className="space-y-6">
                  <QrDisplay
                    hotelId={adminQrHotelId}
                    onHotelChange={setAdminQrHotelId}
                    allowHotelCreation={false}
                  />

                  <div className="bg-white border border-zinc-300 shadow-xs overflow-hidden flex flex-col">
                    <div className="bg-[#f2f2f2] border-b border-zinc-300 px-5 py-3.5">
                      <h3 className="font-condensed font-black text-base uppercase tracking-tight text-black">
                        Bulk Import from Excel
                      </h3>
                      <p className="text-xs font-condensed text-zinc-600">
                        Upload spreadsheets to populate customer or hotel registries at scale.
                      </p>
                    </div>
                    <div className="p-5 sm:p-6 space-y-4">
                      <div className="text-xs font-condensed text-zinc-600 space-y-1 bg-zinc-50 border border-zinc-200 p-3">
                        <p><strong className="text-zinc-900 uppercase">Customer Headers:</strong> <code className="bg-white px-1 border border-zinc-300">full name</code>, <code className="bg-white px-1 border border-zinc-300">phone number</code>, optional <code className="bg-white px-1 border border-zinc-300">email</code>, <code className="bg-white px-1 border border-zinc-300">device id</code>.</p>
                        <p><strong className="text-zinc-900 uppercase">Hotel Headers:</strong> <code className="bg-white px-1 border border-zinc-300">name</code>, <code className="bg-white px-1 border border-zinc-300">password</code>, optional <code className="bg-white px-1 border border-zinc-300">location</code>.</p>
                      </div>

                      <div>
                        <Label htmlFor="customerImport" className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5 block font-condensed">
                          Import Loyal Customers (.xlsx)
                        </Label>
                        <Input
                          id="customerImport"
                          type="file"
                          accept=".xlsx"
                          onChange={(event) => handleImport('customers', event)}
                          className="h-10 bg-white border border-zinc-300 text-zinc-950 rounded-none text-xs file:bg-zinc-100 file:text-zinc-900 file:border-0 file:border-r file:border-zinc-300 file:mr-3 file:px-3 file:py-2 file:font-condensed file:font-bold file:uppercase cursor-pointer"
                        />
                      </div>

                      <div>
                        <Label htmlFor="hotelImport" className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5 block font-condensed">
                          Import Hotels (.xlsx)
                        </Label>
                        <Input
                          id="hotelImport"
                          type="file"
                          accept=".xlsx"
                          onChange={(event) => handleImport('hotels', event)}
                          className="h-10 bg-white border border-zinc-300 text-zinc-950 rounded-none text-xs file:bg-zinc-100 file:text-zinc-900 file:border-0 file:border-r file:border-zinc-300 file:mr-3 file:px-3 file:py-2 file:font-condensed file:font-bold file:uppercase cursor-pointer"
                        />
                      </div>

                      {customerImportResult && (
                        <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-none text-xs text-zinc-700 font-condensed">
                          <strong className="block mb-1 text-zinc-900 font-bold uppercase">Customer Import Summary</strong>
                          <span className="block mb-1">
                            Processed {customerImportResult.processedCount}, created {customerImportResult.createdCount}, updated {customerImportResult.updatedCount}, skipped {customerImportResult.skippedCount}
                          </span>
                          {customerImportResult.errors?.slice(0, 5).map((item, idx) => (
                            <div key={idx} className="text-[#c73f43] mt-0.5">• {item}</div>
                          ))}
                        </div>
                      )}

                      {hotelImportResult && (
                        <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-none text-xs text-zinc-700 font-condensed">
                          <strong className="block mb-1 text-zinc-900 font-bold uppercase">Hotel Import Summary</strong>
                          <span className="block mb-1">
                            Processed {hotelImportResult.processedCount}, created {hotelImportResult.createdCount}, updated {hotelImportResult.updatedCount}, skipped {hotelImportResult.skippedCount}
                          </span>
                          {hotelImportResult.errors?.slice(0, 5).map((item, idx) => (
                            <div key={idx} className="text-[#c73f43] mt-0.5">• {item}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Registered Hotels List */}
              <div className="bg-white border border-zinc-300 shadow-xs overflow-hidden flex flex-col">
                <div className="bg-[#f2f2f2] border-b border-zinc-300 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-condensed font-black text-base uppercase tracking-tight text-black">
                      Registered Hotels
                    </h3>
                    <p className="text-xs font-condensed text-zinc-600">
                      All partner venues currently onboarded in the campaign. Click any hotel to view specific statistics.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 font-condensed font-bold uppercase tracking-wider text-xs px-4 py-1.5 h-8 rounded-none shadow-none transition-colors"
                    onClick={handleOpenDetailedReport}
                  >
                    Show Detailed Report
                  </Button>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="grid gap-3">
                    {adminDashboard?.hotels?.length ? (
                      adminDashboard.hotels.map((hotel) => (
                        <div
                          className="flex items-center justify-between p-4 bg-white border border-zinc-200 hover:border-zinc-400 rounded-none cursor-pointer transition-all hover:shadow-xs"
                          key={hotel.id}
                          onClick={() => handleHotelClick(hotel)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleHotelClick(hotel);
                            }
                          }}
                        >
                          <div>
                            <strong className="block text-zinc-950 uppercase font-condensed font-bold text-base tracking-wide">
                              {hotel.name}
                            </strong>
                            <span className="text-xs text-zinc-500 font-condensed uppercase tracking-wider">
                              {hotel.location || 'Location not provided'}
                            </span>
                          </div>
                          <Badge variant="outline" className="font-mono text-zinc-700 bg-zinc-100 border border-zinc-300 rounded-none uppercase text-xs">
                            #{hotel.id}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-zinc-500 py-6 text-center border border-dashed border-zinc-300 rounded-none font-condensed text-sm uppercase tracking-wider">
                        No hotels have been registered yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Registered Loyal Customers */}
              <div className="bg-white border border-zinc-300 shadow-xs overflow-hidden flex flex-col">
                <div className="bg-[#f2f2f2] border-b border-zinc-300 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-condensed font-black text-base uppercase tracking-tight text-black">
                      Registered Loyal Customers
                    </h3>
                    <p className="text-xs font-condensed text-zinc-600">
                      Admin-only directory of verified consumers, reward counts, and valid scan histories.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 font-condensed font-bold uppercase tracking-wider text-xs px-5 py-1.5 h-8 rounded-none shadow-none transition-colors"
                    onClick={() => setShowCustomerList((current) => !current)}
                  >
                    {showCustomerList ? 'Hide List' : 'Show List'}
                  </Button>
                </div>
                <div className="p-5 sm:p-6">
                  {showCustomerList ? (
                    adminCustomers.length ? (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {adminCustomers.map((customer) => (
                          <div className="bg-white border border-zinc-200 rounded-none p-5 shadow-xs" key={customer.id}>
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <strong className="block text-base text-zinc-950 font-condensed font-black uppercase tracking-wide">
                                  {customer.fullName}
                                </strong>
                                <span className="block text-xs font-mono text-zinc-700">{customer.phoneNumber}</span>
                                <span className="block text-xs text-zinc-500 font-condensed">{customer.email || 'No email provided'}</span>
                              </div>
                              <Badge variant="secondary" className="font-mono text-xs rounded-none border border-zinc-300 bg-zinc-100 text-zinc-700">
                                #{customer.id}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-200">
                              <div>
                                <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-condensed mb-0.5">
                                  Rewards
                                </span>
                                <strong className="block text-2xl text-emerald-600 font-condensed font-black">
                                  {customer.rewardCount}
                                </strong>
                              </div>
                              <div>
                                <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-condensed mb-0.5">
                                  Valid Scans
                                </span>
                                <strong className="block text-2xl text-zinc-950 font-condensed font-black">
                                  {customer.validScanCount}
                                </strong>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-500 py-6 text-center border border-dashed border-zinc-300 rounded-none font-condensed text-sm uppercase tracking-wider">
                        No loyal customers have registered yet.
                      </p>
                    )
                  ) : (
                    <p className="text-xs text-zinc-500 text-center py-6 bg-zinc-50 border border-zinc-200 rounded-none font-condensed uppercase tracking-wider">
                      Customer directory is hidden. Click "Show List" or the customer metric card to expand.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer flush with bottom matching Admin Login Page */}
        <BrandFooter className="mt-0 border-t border-zinc-300" />
      </div>

      {/* Hotel Stats Modal */}
      {selectedHotelForStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white border border-zinc-300 shadow-2xl rounded-none text-zinc-950 overflow-hidden">
            <div className="bg-[#f2f2f2] border-b border-zinc-300 px-5 py-3.5 flex items-center justify-between">
              <div>
                <h3 className="font-condensed font-black tracking-tight uppercase text-lg text-black">
                  {selectedHotelForStats.name} Stats
                </h3>
                <p className="text-xs font-condensed text-zinc-500 uppercase tracking-wider">
                  {selectedHotelForStats.location || 'Location not provided'}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedHotelForStats(null)}
                className="text-zinc-700 hover:text-black font-condensed font-bold uppercase text-xs rounded-none h-8 px-3"
              >
                Close
              </Button>
            </div>
            <div className="p-6">
              {loadingHotelStats ? (
                <div className="text-center py-8 text-zinc-500 font-condensed uppercase tracking-wider text-sm">
                  Loading stats...
                </div>
              ) : selectedHotelStatsData ? (
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Scans today" value={selectedHotelStatsData.scansToday} accent="warm" />
                  <StatCard label="Rewards today" value={selectedHotelStatsData.rewardsGiven} accent="green" />
                  <StatCard label="Max Scans" value={selectedHotelStatsData.maxScanCount > 0 ? selectedHotelStatsData.maxScanCount : '--'} accent="dark" />
                  <StatCard
                    label="Max Scan Date"
                    value={selectedHotelStatsData.maxScanDate ? new Date(selectedHotelStatsData.maxScanDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--'}
                    accent="dark"
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-[#c73f43] font-condensed uppercase tracking-wider text-sm">
                  Failed to load stats.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Detailed Report Modal */}
      {showDetailedReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-5xl bg-white border border-zinc-300 shadow-2xl rounded-none text-zinc-950 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-[#f2f2f2] border-b border-zinc-300 px-5 py-3.5 shrink-0 flex items-center justify-between">
              <div>
                <h3 className="font-condensed font-black tracking-tight uppercase text-lg text-black">
                  Campaign Detailed Report
                </h3>
                <p className="text-xs font-condensed text-zinc-600">
                  Aggregated daily performance by hotel.
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowDetailedReportModal(false)}
                className="text-zinc-700 hover:text-black font-condensed font-bold uppercase text-xs rounded-none h-8 px-3"
              >
                Close
              </Button>
            </div>
            <div className="p-6 overflow-hidden flex flex-col gap-4">
              <div className="flex flex-wrap sm:flex-nowrap gap-4 shrink-0">
                <div className="grid gap-1.5 flex-1">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 font-condensed">Filter by Date</Label>
                  <Input 
                    type="date"
                    value={reportFilterDate}
                    onChange={(e) => {
                      setReportFilterDate(e.target.value);
                      setReportPage(1);
                    }}
                    className="bg-white border border-zinc-300 rounded-none h-9 text-xs text-zinc-950"
                  />
                </div>
                <div className="grid gap-1.5 flex-1">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 font-condensed">Filter by Hotel Name</Label>
                  <Input 
                    placeholder="Search hotel..."
                    value={reportFilterHotelInput}
                    onChange={(e) => setReportFilterHotelInput(e.target.value)}
                    className="bg-white border border-zinc-300 rounded-none h-9 text-xs text-zinc-950"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-auto border border-zinc-300 bg-white">
                {loadingDetailedReport ? (
                  <div className="text-center py-8 text-zinc-500 font-condensed uppercase tracking-wider text-sm">
                    Loading report...
                  </div>
                ) : (
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-[11px] uppercase bg-[#f4f4f5] text-zinc-700 border-b border-zinc-300 sticky top-0 font-condensed font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Hotel</th>
                        <th className="px-6 py-3">Total Scans</th>
                        <th className="px-6 py-3">Valid Scans</th>
                        <th className="px-6 py-3">Suspicious Scans</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedReportData.map((row, idx) => (
                        <tr key={idx} className="border-b border-zinc-200 bg-white hover:bg-zinc-50 transition-colors">
                          <td className="px-6 py-3.5 font-mono text-xs text-zinc-700">{row.date}</td>
                          <td className="px-6 py-3.5 font-bold font-condensed uppercase text-zinc-950">{row.hotelName}</td>
                          <td className="px-6 py-3.5 font-bold font-condensed">{row.totalScans}</td>
                          <td className="px-6 py-3.5 font-bold font-condensed text-emerald-600">{row.validScans}</td>
                          <td className="px-6 py-3.5 font-bold font-condensed text-[#c73f43]">{row.suspiciousScans}</td>
                        </tr>
                      ))}
                      {paginatedReportData.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-zinc-500 font-condensed uppercase tracking-wider">
                            No data available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <Button 
                  variant="outline" 
                  className="bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 font-condensed font-bold uppercase tracking-wider text-xs px-4 py-1.5 h-8 rounded-none transition-colors" 
                  disabled={reportPage <= 1}
                  onClick={() => setReportPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs text-zinc-600 font-condensed uppercase tracking-wider">
                  Page {reportPage} of {totalReportPages}
                </span>
                <Button 
                  variant="outline" 
                  className="bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 font-condensed font-bold uppercase tracking-wider text-xs px-4 py-1.5 h-8 rounded-none transition-colors" 
                  disabled={reportPage >= totalReportPages}
                  onClick={() => setReportPage(p => Math.min(totalReportPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hotel Detailed Report Modal */}
      {showHotelDetailedReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-4xl bg-white border border-zinc-300 shadow-2xl rounded-none text-zinc-950 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-[#f2f2f2] border-b border-zinc-300 px-5 py-3.5 shrink-0 flex items-center justify-between">
              <div>
                <h3 className="font-condensed font-black tracking-tight uppercase text-lg text-black">
                  Hotel Detailed Report
                </h3>
                <p className="text-xs font-condensed text-zinc-600">
                  Your daily performance history.
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowHotelDetailedReportModal(false)}
                className="text-zinc-700 hover:text-black font-condensed font-bold uppercase text-xs rounded-none h-8 px-3"
              >
                Close
              </Button>
            </div>
            <div className="p-6 overflow-hidden flex flex-col gap-4">
              <div className="flex gap-4 shrink-0">
                <div className="grid gap-1.5 w-full max-w-sm">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 font-condensed">Filter by Date</Label>
                  <Input 
                    type="date"
                    value={hotelReportFilterDate}
                    onChange={(e) => {
                      setHotelReportFilterDate(e.target.value);
                      setHotelReportPage(1);
                    }}
                    className="bg-white border border-zinc-300 rounded-none h-9 text-xs text-zinc-950"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-auto border border-zinc-300 bg-white">
                {loadingHotelDetailedReport ? (
                  <div className="text-center py-8 text-zinc-500 font-condensed uppercase tracking-wider text-sm">
                    Loading report...
                  </div>
                ) : (
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-[11px] uppercase bg-[#f4f4f5] text-zinc-700 border-b border-zinc-300 sticky top-0 font-condensed font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Total Scans</th>
                        <th className="px-6 py-3">Valid Scans</th>
                        <th className="px-6 py-3">Suspicious Scans</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hotelPaginatedReportData.map((row, idx) => (
                        <tr key={idx} className="border-b border-zinc-200 bg-white hover:bg-zinc-50 transition-colors">
                          <td className="px-6 py-3.5 font-mono text-xs text-zinc-700">{row.date}</td>
                          <td className="px-6 py-3.5 font-bold font-condensed">{row.totalScans}</td>
                          <td className="px-6 py-3.5 font-bold font-condensed text-emerald-600">{row.validScans}</td>
                          <td className="px-6 py-3.5 font-bold font-condensed text-[#c73f43]">{row.suspiciousScans}</td>
                        </tr>
                      ))}
                      {hotelPaginatedReportData.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center text-zinc-500 font-condensed uppercase tracking-wider">
                            No data available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <Button 
                  variant="outline" 
                  className="bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 font-condensed font-bold uppercase tracking-wider text-xs px-4 py-1.5 h-8 rounded-none transition-colors" 
                  disabled={hotelReportPage <= 1}
                  onClick={() => setHotelReportPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs text-zinc-600 font-condensed uppercase tracking-wider">
                  Page {hotelReportPage} of {hotelTotalReportPages}
                </span>
                <Button 
                  variant="outline" 
                  className="bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 font-condensed font-bold uppercase tracking-wider text-xs px-4 py-1.5 h-8 rounded-none transition-colors" 
                  disabled={hotelReportPage >= hotelTotalReportPages}
                  onClick={() => setHotelReportPage(p => Math.min(hotelTotalReportPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
