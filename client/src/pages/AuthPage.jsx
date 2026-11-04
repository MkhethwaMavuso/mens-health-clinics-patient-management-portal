import { useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { user, signIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const registering = location.pathname === '/register';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(form, registering);
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not complete that request.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <div className="brand-mark">MC<span>.</span></div>
        <div className="story-copy">
          <p className="eyebrow">Care, without the runaround</p>
          <h1>Your health deserves <em>your attention.</em></h1>
          <p>Book a private appointment and keep your care in one secure place.</p>
        </div>
        <div className="privacy-note"><ShieldCheck size={18} /> Private by design</div>
        <div className="story-index">01 <span /> A better kind of clinic visit</div>
      </section>
      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <p className="eyebrow">Patient portal</p>
          <h2>{registering ? 'Create your account' : 'Welcome back'}</h2>
          <p className="form-intro">{registering ? 'Start with the essentials. Your account is private to you.' : 'Sign in to manage appointments and follow-up care.'}</p>
          <form className="form-stack" onSubmit={submit}>
            {registering && (
              <label>Full name<input autoComplete="name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            )}
            <label>Email address<input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            <label>Password<input type="password" autoComplete={registering ? 'new-password' : 'current-password'} minLength="12" maxLength="128" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><small>Use at least 12 characters.</small></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-wide" disabled={busy} type="submit">{busy ? 'Please wait...' : registering ? 'Create account' : 'Sign in'} <ArrowRight size={17} /></button>
          </form>
          <p className="switch-auth">{registering ? 'Already have an account?' : 'New to the clinic?'} <Link to={registering ? '/login' : '/register'}>{registering ? 'Sign in' : 'Create an account'}</Link></p>
          <p className="staff-hint">Clinic staff sign in with their administrator-provided account.</p>
        </div>
      </section>
    </main>
  );
}