import { useEffect, useState } from 'react';
import QrDisplay from './QrDisplay';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
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
  hotelLogin,
  importCustomers,
  importHotels,
  logout,
} from '../services/api';

function StatCard({ label, value, accent, onClick, active = false }) {
  const accentColors = {
    warm: 'metric-gold text-foreground',
    green: 'bg-emerald-950/30 text-foreground border-emerald-500/60',
    red: 'metric-danger text-foreground',
    dark: 'bg-zinc-950 text-foreground border-zinc-600',
  };
  
  const baseClasses = `p-6 rounded-none border transition-all ${accentColors[accent] || 'bg-background'} ${onClick ? 'cursor-pointer hover:shadow hover:-translate-y-0.5 hover:border-primary' : ''} ${active ? 'ring-1 ring-primary ring-offset-2 ring-offset-background' : ''}`;

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
      <span className="block text-sm font-bold font-display uppercase tracking-wider opacity-80 mb-2">{label}</span>
      <strong className="block text-4xl font-extrabold font-display">{value}</strong>
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
      setError(getReadableError(requestError, 'Import failed.'));
    } finally {
      event.target.value = '';
      setBusy(false);
    }
  };

  const hotelView = mode === 'hotel' && sessionUser?.role === 'hotel';
  const adminView = mode === 'admin' && sessionUser?.role === 'admin';

  return (
    <div className="grid gap-6 w-full max-w-5xl mx-auto">
      <Card className="border-zinc-700 shadow-none rounded-none bg-zinc-950">
        <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-muted-foreground mb-1">
              {mode === 'admin' ? 'Admin control room' : 'Hotel partner portal'}
            </p>
            <CardTitle className="text-2xl mb-2 font-display uppercase tracking-tight">
              {mode === 'admin' ? 'Marathon Spirits admin control room' : 'Hotel loyalty dashboard'}
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              {mode === 'admin'
                ? 'Admin access is kept separate from the hotel experience. Use this space to manage hotels, loyal customers, and imports.'
                : 'Hotel teams only see their own campaign information, including scans, rewards, and suspicious activity.'}
            </CardDescription>
          </div>
          {sessionUser && (
            <div className="flex gap-2 shrink-0 flex-wrap justify-end">
              <Button variant="outline" className="rounded-none px-6" onClick={() => loadDashboardData()} disabled={busy}>
                {busy ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button variant="ghost" className="border border-border rounded-none px-6" onClick={handleLogout} disabled={busy}>
                Logout
              </Button>
            </div>
          )}
        </CardHeader>
      </Card>

      {!sessionUser && mode === 'hotel' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="rounded-none shadow-none border-zinc-700 bg-zinc-950">
            <CardHeader>
              <CardTitle>Hotel login</CardTitle>
              <CardDescription>Sign in using your hotel name and password to see only your hotel campaign dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-5 bg-zinc-900 border border-zinc-700 p-6 shadow-sm rounded-none" onSubmit={handleHotelLogin}>
                <div className="grid gap-2">
                  <Label htmlFor="hotelName">Hotel name</Label>
                  <Input
                    id="hotelName"
                    value={hotelLoginForm.hotelName}
                    onChange={(event) => setHotelLoginForm((current) => ({ ...current, hotelName: event.target.value }))}
                    placeholder="Ocean View Hotel"
                    required
                    className="h-12 bg-card focus:bg-card transition-all rounded-none focus:-translate-y-1"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hotelPassword">Password</Label>
                  <Input
                    id="hotelPassword"
                    type="password"
                    value={hotelLoginForm.password}
                    onChange={(event) => setHotelLoginForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Enter hotel password"
                    required
                    className="h-12 bg-card focus:bg-card transition-all rounded-none focus:-translate-y-1"
                  />
                </div>
                <Button type="submit" disabled={busy} className="mt-2 text-md h-12 w-full rounded-none">
                  {busy ? 'Signing in...' : 'Open hotel dashboard'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {!sessionUser && mode === 'admin' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="rounded-none shadow-none border-zinc-700 bg-zinc-950">
            <CardHeader>
              <CardTitle>Admin login</CardTitle>
              <CardDescription>Use the Marathon Spirits admin credentials to open company-wide controls.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-5 bg-zinc-900 border border-zinc-700 p-6 shadow-sm rounded-none" onSubmit={handleAdminLogin}>
                <div className="grid gap-2">
                  <Label htmlFor="adminUsername">Username</Label>
                  <Input
                    id="adminUsername"
                    value={adminLoginForm.username}
                    onChange={(event) => setAdminLoginForm((current) => ({ ...current, username: event.target.value }))}
                    placeholder="admin"
                    required
                    className="h-12 bg-card focus:bg-card transition-all rounded-none focus:-translate-y-1"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="adminPassword">Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={adminLoginForm.password}
                    onChange={(event) => setAdminLoginForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Enter admin password"
                    required
                    className="h-12 bg-card focus:bg-card transition-all rounded-none focus:-translate-y-1"
                  />
                </div>
                <Button type="submit" disabled={busy} className="mt-2 text-md h-12 w-full rounded-none">
                  {busy ? 'Signing in...' : 'Open admin dashboard'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="rounded-none">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {successMessage && (
        <Alert className="bg-[#A0C878]/10 text-[#A0C878] border-[#A0C878]/30 rounded-none">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {hotelView && (
        <div className="grid gap-6">
          <Card className="rounded-none shadow-none border-zinc-700 bg-zinc-950">
            <CardContent className="p-6">
              <div className="flex items-center justify-between bg-zinc-900 border border-zinc-700 p-4 rounded-none mb-6">
                <div>
                  <strong className="block text-lg text-foreground font-display uppercase">{sessionUser.displayName}</strong>
                  <span className="text-sm text-muted-foreground">Hotel account</span>
                </div>
                <Badge variant="outline" className="bg-background rounded-none border-border uppercase px-4 py-1.5">Active session</Badge>
              </div>
              <div className="grid sm:grid-cols-3 gap-6">
                <StatCard label="Scans today" value={hotelStats?.scansToday ?? '--'} accent="warm" />
                <StatCard label="Rewards given" value={hotelStats?.rewardsGiven ?? '--'} accent="green" />
                <StatCard label="Suspicious scans" value={hotelStats?.suspiciousScans ?? '--'} accent="red" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {adminView && (
        <div className="grid gap-6">
          <Card className="rounded-none shadow-none border-zinc-700 bg-zinc-950">
            <CardContent className="p-6">
              <div className="flex items-center justify-between bg-zinc-900 border border-zinc-700 p-4 rounded-none mb-6">
                <div>
                  <strong className="block text-lg text-foreground font-display uppercase tracking-wider">{sessionUser.displayName}</strong>
                  <span className="text-sm text-muted-foreground">Admin account</span>
                </div>
                <Badge variant="outline" className="bg-foreground text-background border-transparent rounded-none uppercase px-4 py-1.5">Admin privileged</Badge>
              </div>
              <div className="grid sm:grid-cols-4 gap-6 mb-4">
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
              <p className="text-sm text-muted-foreground">Click the registered customers card to {showCustomerList ? 'hide' : 'view'} the full customer list.</p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-[1fr_1.5fr] gap-6 items-start">
            <Card className="rounded-none border-border shadow-none">
              <CardHeader>
                <CardTitle>Register a hotel</CardTitle>
                <CardDescription>Create one hotel manually, or use the import tools below for bulk onboarding.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-5 bg-background border border-border p-6 shadow-sm rounded-none" onSubmit={handleHotelCreate}>
                  <div className="grid gap-2">
                    <Label htmlFor="newHotelName">Hotel name</Label>
                    <Input
                      id="newHotelName"
                      value={createHotelForm.name}
                      onChange={(event) => setCreateHotelForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Ocean View Hotel"
                      required
                      className="h-12 bg-card focus:bg-card transition-all rounded-none focus:-translate-y-1"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="newHotelLocation">Location</Label>
                    <Input
                      id="newHotelLocation"
                      value={createHotelForm.location}
                      onChange={(event) => setCreateHotelForm((current) => ({ ...current, location: event.target.value }))}
                      placeholder="Mogadishu"
                      className="h-12 bg-card focus:bg-card transition-all rounded-none focus:-translate-y-1"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="newHotelPassword">Password</Label>
                    <Input
                      id="newHotelPassword"
                      type="password"
                      value={createHotelForm.password}
                      onChange={(event) => setCreateHotelForm((current) => ({ ...current, password: event.target.value }))}
                      placeholder="Hotel dashboard password"
                      required
                      className="h-12 bg-card focus:bg-card transition-all rounded-none focus:-translate-y-1"
                    />
                  </div>
                  <Button type="submit" disabled={busy} className="mt-2 w-full rounded-none py-[13px]">
                    {busy ? 'Saving...' : 'Register hotel'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid gap-6">
              <QrDisplay
                hotelId={adminQrHotelId}
                onHotelChange={setAdminQrHotelId}
                allowHotelCreation={false}
              />
              
              <Card className="rounded-none border-border shadow-none">
                <CardHeader>
                  <CardTitle>Bulk import from Excel</CardTitle>
                  <CardDescription>
                    Customer sheet headers: <code className="bg-muted px-1 rounded-none text-foreground border border-border">full name</code>, <code className="bg-muted px-1 rounded-none text-foreground border border-border">phone number</code>, optional <code className="bg-muted px-1 rounded-none text-foreground border border-border">email</code>, <code className="bg-muted px-1 rounded-none text-foreground border border-border">device id</code>.
                    Hotel sheet headers: <code className="bg-muted px-1 rounded-none text-foreground border border-border">name</code>, <code className="bg-muted px-1 rounded-none text-foreground border border-border">password</code>, optional <code className="bg-muted px-1 rounded-none text-foreground border border-border">location</code>.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="customerImport">Import loyal customers (.xlsx)</Label>
                    <Input id="customerImport" type="file" accept=".xlsx" onChange={(event) => handleImport('customers', event)} className="file:bg-card file:text-foreground file:-mx-3 file:-my-1.5 file:px-3 file:py-1.5 file:rounded-none file:border-r file:border-border file:mr-3 cursor-pointer rounded-none bg-background cursor-pointer" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="hotelImport">Import hotels (.xlsx)</Label>
                    <Input id="hotelImport" type="file" accept=".xlsx" onChange={(event) => handleImport('hotels', event)} className="file:bg-card file:text-foreground file:-mx-3 file:-my-1.5 file:px-3 file:py-1.5 file:rounded-none file:border-r file:border-border file:mr-3 cursor-pointer rounded-none bg-background cursor-pointer" />
                  </div>
                  
                  {customerImportResult && (
                    <div className="bg-card border border-border p-4 rounded-none mt-2 text-sm text-muted-foreground">
                      <strong className="block mb-1 text-foreground">Customer import summary</strong>
                      <span className="block mb-2">
                        Processed {customerImportResult.processedCount}, created {customerImportResult.createdCount},
                        updated {customerImportResult.updatedCount}, skipped {customerImportResult.skippedCount}
                      </span>
                      {customerImportResult.errors?.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="text-destructive text-xs mt-1">• {item}</div>
                      ))}
                    </div>
                  )}
                  {hotelImportResult && (
                    <div className="bg-card border border-border p-4 rounded-none mt-2 text-sm text-muted-foreground">
                      <strong className="block mb-1 text-foreground">Hotel import summary</strong>
                      <span className="block mb-2">
                        Processed {hotelImportResult.processedCount}, created {hotelImportResult.createdCount},
                        updated {hotelImportResult.updatedCount}, skipped {hotelImportResult.skippedCount}
                      </span>
                      {hotelImportResult.errors?.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="text-destructive text-xs mt-1">• {item}</div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="rounded-none border-border shadow-none">
            <CardHeader>
              <CardTitle>Registered hotels</CardTitle>
              <CardDescription>All hotels currently onboarded into the campaign.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {adminDashboard?.hotels?.length ? adminDashboard.hotels.map((hotel) => (
                  <div className="flex items-center justify-between p-4 bg-background border border-border rounded-none" key={hotel.id}>
                    <div>
                      <strong className="block text-foreground uppercase font-display tracking-wider">{hotel.name}</strong>
                      <span className="text-sm text-muted-foreground">{hotel.location || 'Location not provided'}</span>
                    </div>
                    <Badge variant="outline" className="font-mono text-muted-foreground bg-card rounded-none uppercase">#{hotel.id}</Badge>
                  </div>
                )) : (
                  <p className="text-muted-foreground py-4 text-center border border-dashed rounded-none border-border">No hotels have been registered yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Registered loyal customers</CardTitle>
                <CardDescription>Admin-only view of each customer’s reward count and valid scan history.</CardDescription>
              </div>
              <Button variant="outline" className="rounded-none px-6" onClick={() => setShowCustomerList((current) => !current)}>
                {showCustomerList ? 'Hide list' : 'Show list'}
              </Button>
            </CardHeader>
            <CardContent>
              {showCustomerList ? (
                adminCustomers.length ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {adminCustomers.map((customer) => (
                      <div className="bg-card border border-border rounded-none p-5" key={customer.id}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <strong className="block text-lg text-foreground font-display uppercase tracking-widest">{customer.fullName}</strong>
                            <span className="block text-sm text-foreground">{customer.phoneNumber}</span>
                            <span className="block text-sm text-muted-foreground">{customer.email || 'No email provided'}</span>
                          </div>
                          <Badge variant="secondary" className="font-mono text-xs rounded-none border border-border">#{customer.id}</Badge>
                        </div>
                        <div className="flex gap-6 mt-4 pt-4 border-t border-border">
                          <div>
                            <span className="block text-xs uppercase tracking-[0.1em] text-muted-foreground mb-1">Rewards</span>
                            <strong className="block text-2xl text-foreground font-display">{customer.rewardCount}</strong>
                          </div>
                          <div>
                            <span className="block text-xs uppercase tracking-[0.1em] text-muted-foreground mb-1">Valid scans</span>
                            <strong className="block text-2xl text-foreground font-display">{customer.validScanCount}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-6 text-center border border-dashed rounded-none border-border">No loyal customers have registered yet.</p>
                )
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6 bg-card border border-border rounded-none">Customer analytics are hidden until you open the registered customers list.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
