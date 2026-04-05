import { useEffect, useState } from 'react';
import { getCurrentCustomer, getReadableError, registerLoyalCustomer } from '../services/api';
import logoFallback from '../assets/logo-placeholder.svg';

const emptyForm = {
  fullName: '',
  phoneNumber: '',
};

function LoyalCustomerRegistration({ deviceId = '', standalone = false }) {
  const [form, setForm] = useState(emptyForm);
  const [customer, setCustomer] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [brandLogo, setBrandLogo] = useState('/src/assets/logo.png');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getCurrentCustomer();
        setCustomer(profile);
        if (profile) {
          setForm({
            fullName: profile.fullName || '',
            phoneNumber: profile.phoneNumber || '',
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
      const savedCustomer = await registerLoyalCustomer({
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
      });
      setCustomer(savedCustomer);
      setForm({
        fullName: savedCustomer.fullName || '',
        phoneNumber: savedCustomer.phoneNumber || '',
      });
      setMessage(savedCustomer.registeredAt
        ? 'Congratulations! You are one of our rare loyal customers.'
        : 'Profile saved.');
    } catch (requestError) {
      setError(getReadableError(requestError, 'Could not save your loyalty profile right now.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={standalone ? 'register-experience' : 'panel panel--wide'}>
      <article className={standalone ? 'register-hero-card' : 'card register-card'}>
        <div className="register-brand">
          <img
            className="register-brand__logo"
            src={brandLogo}
            alt="Marathon Klassics logo"
            onError={() => setBrandLogo(logoFallback)}
          />
          <div>
            <p className="eyebrow">Marathon Klassics</p>
            <h1>Rare loyal customer registration</h1>
            <p>
              Join the Marathon Klassics loyalty customer giveaway and keep your reward progress tied to this mobile browser.
            </p>
          </div>
        </div>

        <div className="register-grid">
          <section className="card register-card__form">
            <h3>{customer ? 'Update your registration' : 'Register now'}</h3>
            <p className="hint">
              Enter your username and phone number once. We save a secure device id in this browser so future scans stay connected to you.
            </p>
            <form className="form-stack" onSubmit={handleSubmit}>
              <label className="field">
                <span>Username</span>
                <input
                  value={form.fullName}
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                  placeholder="Your preferred name"
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
              <button className="button button--primary" type="submit" disabled={busy || loading}>
                {busy ? 'Saving your spot...' : customer ? 'Update my profile' : 'Become a loyal customer'}
              </button>
            </form>
          </section>

          <section className="card card--soft register-card__details">
            <h3>Your loyalty profile</h3>
            <div className="info-list">
              <div>
                <strong>Status</strong>
                <span>{loading ? 'Checking...' : customer ? 'Registered' : 'Ready to register'}</span>
              </div>
              <div>
                <strong>Reward</strong>
                <span>Free beer after 10 valid scans at the same hotel.</span>
              </div>
              <div>
                <strong>Browser device id</strong>
                <span className="register-device-id">{deviceId || 'Preparing secure device id...'}</span>
              </div>
            </div>

            {customer && (
              <div className="info-box register-success-card">
                <strong>{customer.fullName}</strong>
                <span>{customer.phoneNumber}</span>
                <span>Congratulations! You are one of our rare loyal customers.</span>
              </div>
            )}
          </section>
        </div>

        {message && <p className="message message--success">{message}</p>}
        {error && <p className="message message--error">{error}</p>}
      </article>
    </section>
  );
}

export default LoyalCustomerRegistration;
