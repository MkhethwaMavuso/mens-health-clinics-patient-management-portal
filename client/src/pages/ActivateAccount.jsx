import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function ActivateAccount() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/auth/activate', { token: params.get('token'), password });
      setUser(data.user);
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not activate this account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="activation-page">
      <div className="brand-mark">MC<span>.</span></div>
      <p className="eyebrow">Account setup</p>
      <h1>Choose a password</h1>
      <p>Your clinic account is ready. Set a private password to view your appointment.</p>
      <form className="form-stack" onSubmit={submit}>
        <label>New password<input type="password" minLength="12" maxLength="128" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} /><small>Use at least 12 characters.</small></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-wide" disabled={busy} type="submit">{busy ? 'Setting up...' : 'Activate account'} <ArrowRight size={17} /></button>
      </form>
      <Link className="text-link" to="/login">Return to sign in</Link>
    </main>
  );
}