import { useEffect, useState } from 'react';
import { getCurrentCustomer, getReadableError, registerLoyalCustomer } from '../services/api';

const emptyForm = {
  fullName: '',
  phoneNumber: '',
  email: '',
};

function LoyalCustomerRegistration() {
  const [form, setForm] = useState(emptyForm);
  const [customer, setCustomer] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getCurrentCustomer();
        setCustomer(profile);
        if (profile) {
          setForm({
            fullName: profile.fullName || '',
            phoneNumber: profile.phoneNumber || '',
            email: profile.email || '',
          });
        }
      } catch (requestError) {
        setError(getReadableError(requestError, 'Could not load your loyalty profile.'));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const savedCustomer = await registerLoyalCustomer(form);
      setCustomer(savedCustomer);
      setForm({
        fullName: savedCustomer.fullName || '',
        phoneNumber: savedCustomer.phoneNumber || '',
        email: savedCustomer.email || '',
      });
      setMessage(savedCustomer.registeredAt ? 'Your loyalty profile is ready for future scan rewards.' : 'Profile saved.');
    } catch (requestError) {
      setError(getReadableError(requestError, 'Could not save your loyalty profile right now.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel panel--wide">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Loyal Customer</p>
          <h2>Register once and keep your beer reward progress on this device</h2>
          <p className="section-copy">
            Your scans already count on this browser. Registration simply adds your loyalty profile so the hotel can recognize you as a returning guest.
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        <article className="card">
          <h3>{customer ? 'Update your loyalty profile' : 'Create your loyalty profile'}</h3>
          <p className="hint">
            Use the same phone number each time. Your free beer is still earned after 10 valid scans on this device.
          </p>
          <form className="form-stack" onSubmit={handleSubmit}>
            <label className="field">
              <span>Full name</span>
              <input
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                placeholder="Guest full name"
                required
              />
            </label>
            <label className="field">
              <span>Phone number</span>
              <input
                value={form.phoneNumber}
                onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                placeholder="+251 9xx xxx xxx"
                required
              />
            </label>
            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="Optional email"
              />
            </label>
            <button className="button button--primary" type="submit" disabled={busy || loading}>
              {busy ? 'Saving profile...' : customer ? 'Update profile' : 'Register as loyal customer'}
            </button>
          </form>
        </article>

        <article className="card card--soft">
          <h3>Your device loyalty status</h3>
          <div className="info-list">
            <div>
              <strong>Status</strong>
              <span>{loading ? 'Checking...' : customer ? 'Registered' : 'Not registered yet'}</span>
            </div>
            <div>
              <strong>Reward rule</strong>
              <span>Free beer after 10 valid scans at the same hotel.</span>
            </div>
            <div>
              <strong>Why register</strong>
              <span>Hotels can keep a clean loyal-customer roster while your device keeps scan progress fair.</span>
            </div>
          </div>
          {customer && (
            <div className="info-box">
              <strong>{customer.fullName}</strong>
              <span>{customer.phoneNumber}</span>
              <span>{customer.email || 'No email saved'}</span>
            </div>
          )}
        </article>
      </div>

      {message && <p className="message message--success">{message}</p>}
      {error && <p className="message message--error">{error}</p>}
    </section>
  );
}

export default LoyalCustomerRegistration;
