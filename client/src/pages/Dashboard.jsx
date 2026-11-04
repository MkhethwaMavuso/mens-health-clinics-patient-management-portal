import { useEffect, useState } from 'react';
import { Activity, CalendarDays, Check, Clock3, LogOut, Plus, Stethoscope, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AppointmentTable from '../components/AppointmentTable';
import { useAuth } from '../context/AuthContext';

function initialAppointmentTime() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function currentAppointmentTime() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function SectionHeading({ eyebrow, title, action }) {
  return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{action}</div>;
}

function Feedback({ message, error }) {
  if (!message) return null;
  return <p className={error ? 'form-error feedback' : 'form-success feedback'} role="status">{message}</p>;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [walkIn, setWalkIn] = useState({ name: '', email: '', appointmentDate: currentAppointmentTime(), doctorId: '' });
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [newDoctor, setNewDoctor] = useState({ name: '', email: '', password: '' });
  const [editingPatient, setEditingPatient] = useState(null);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [bookingDate, setBookingDate] = useState(initialAppointmentTime());
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function loadData() {
    const { data } = await api.get('/appointments');
    setAppointments(data.appointments);
    if (user.role === 'admin') {
      const [doctorResult, patientResult, adminResult] = await Promise.all([
        api.get('/admin/doctors'), api.get('/admin/patients'), api.get('/admin/admins')
      ]);
      setDoctors(doctorResult.data.doctors);
      setPatients(patientResult.data.patients);
      setAdmins(adminResult.data.admins);
    } else if (user.role === 'doctor') {
      const { data: adminResult } = await api.get('/admin/admins');
      setAdmins(adminResult.admins);
    }
  }

  useEffect(() => {
    loadData().catch(() => {
      setError(true);
      setMessage('We could not load your workspace. Refresh to try again.');
    });
  }, [user.role]);

  function reportSuccess(text) {
    setError(false);
    setMessage(text);
  }

  function reportError(requestError) {
    setError(true);
    setMessage(requestError.response?.data?.message || 'That action could not be completed.');
  }

  async function runAction(action, successText) {
    setBusy(true);
    setMessage('');
    try {
      await action();
      await loadData();
      reportSuccess(successText);
    } catch (requestError) {
      reportError(requestError);
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const counts = {
    booked: appointments.filter((item) => item.status === 'Booked').length,
    arrived: appointments.filter((item) => item.status === 'Arrived').length,
    complete: appointments.filter((item) => item.status === 'Complete').length
  };
  const roleLabel = { patient: 'Patient', admin: 'Reception', doctor: 'Clinical' }[user.role];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand-lockup" href="/" aria-label="Men's Clinic home"><span className="brand-mark">MC<span>.</span></span><span>MEN'S CLINIC<small>CARE PORTAL</small></span></a>
        <div className="sidebar-rule" />
        <p className="sidebar-label">WORKSPACE</p>
        <div className="nav-item nav-item-active"><Activity size={17} /> Overview</div>
        <div className="sidebar-caption">Your care, organized around you.</div>
        <div className="sidebar-bottom"><span className="privacy-dot" /><span>Secure patient workspace</span></div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <span className="topbar-context">{roleLabel} portal <span>/</span> Overview</span>
          <div className="account-menu"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span><div><strong>{user.name}</strong><small>{user.email}</small></div><button className="icon-only" title="Sign out" onClick={handleSignOut}><LogOut size={18} /></button></div>
        </header>

        <div className="page-content">
          <div className="welcome-row">
            <div><p className="eyebrow">{new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</p><h1>{user.role === 'patient' ? `Good to see you, ${user.name.split(' ')[0]}.` : `${roleLabel} overview`}</h1><p className="page-lede">{user.role === 'patient' ? 'A clear view of your appointments and next steps.' : user.role === 'admin' ? 'Today at the clinic, at a glance.' : 'Your assigned sessions and clinical follow-ups.'}</p></div>
            {user.role === 'patient' && <a className="button" href="#book"><Plus size={17} /> Book a visit</a>}
          </div>

          <Feedback message={message} error={error} />

          <section className="stat-row" aria-label="Appointment summary">
            <div className="stat-item"><span className="stat-icon"><CalendarDays size={18} /></span><div><small>Booked</small><strong>{counts.booked}</strong></div><span className="stat-note">upcoming</span></div>
            <div className="stat-item"><span className="stat-icon stat-icon-coral"><Clock3 size={18} /></span><div><small>Arrived</small><strong>{counts.arrived}</strong></div><span className="stat-note">in progress</span></div>
            <div className="stat-item"><span className="stat-icon stat-icon-moss"><Check size={18} /></span><div><small>Complete</small><strong>{counts.complete}</strong></div><span className="stat-note">sessions</span></div>
          </section>

          {user.role === 'patient' && (
            <section className="content-section" id="book">
              <SectionHeading eyebrow="Make time for your health" title="Book an appointment" />
              <form className="booking-form" onSubmit={(event) => {
                event.preventDefault();
                runAction(() => api.post('/appointments', { appointmentDate: new Date(bookingDate).toISOString() }), 'Your appointment is booked. A confirmation email is on its way.');
              }}>
                <label>Date and time<input type="datetime-local" required min={initialAppointmentTime()} value={bookingDate} onChange={(event) => setBookingDate(event.target.value)} /></label>
                <button className="button" disabled={busy} type="submit"><CalendarDays size={16} /> Confirm booking</button>
              </form>
            </section>
          )}

          {user.role === 'admin' && (
            <section className="content-section">
              <SectionHeading eyebrow="Reception" title="Register a walk-in" />
              <form className="walk-in-form" onSubmit={(event) => {
                event.preventDefault();
                runAction(() => api.post('/admin/walk-ins', { ...walkIn, appointmentDate: new Date(walkIn.appointmentDate).toISOString() }), 'Walk-in registered. Account setup instructions were emailed.');
                setWalkIn({ name: '', email: '', appointmentDate: currentAppointmentTime(), doctorId: '' });
              }}>
                <label>Patient name<input required value={walkIn.name} onChange={(event) => setWalkIn({ ...walkIn, name: event.target.value })} /></label>
                <label>Email address<input type="email" required value={walkIn.email} onChange={(event) => setWalkIn({ ...walkIn, email: event.target.value })} /></label>
                <label>Arrival time<input type="datetime-local" required value={walkIn.appointmentDate} onChange={(event) => setWalkIn({ ...walkIn, appointmentDate: event.target.value })} /></label>
                <label>Assign clinician<select value={walkIn.doctorId} onChange={(event) => setWalkIn({ ...walkIn, doctorId: event.target.value })}><option value="">Assign later</option>{doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>{doctor.name}</option>)}</select></label>
                <button className="button" disabled={busy} type="submit"><Plus size={16} /> Register walk-in</button>
              </form>
            </section>
          )}

          <section className="content-section">
            <SectionHeading eyebrow={user.role === 'patient' ? 'Your care timeline' : user.role === 'admin' ? 'Front desk' : 'Assigned to you'} title={user.role === 'patient' ? 'Appointments & history' : 'Appointments'} />
            <AppointmentTable
              appointments={appointments}
              role={user.role}
              doctors={doctors}
              onArrived={(id) => runAction(() => api.patch(`/appointments/${id}/arrived`), 'Patient marked as arrived.')}
              onAssign={(id, doctorId) => runAction(() => api.patch(`/appointments/${id}/assign`, { doctorId }), 'Clinician assignment updated.')}
              onComplete={(id, clinicalNotes) => runAction(() => api.patch(`/appointments/${id}/complete`, { clinicalNotes }), 'Consultation saved and marked complete.')}
            />
          </section>

          {user.role === 'admin' && (
            <section className="content-section">
              <SectionHeading eyebrow="Clinical team" title="Doctors" />
              <form className="admin-create-form" onSubmit={(event) => {
                event.preventDefault();
                runAction(() => api.post('/admin/doctors', newDoctor), 'Doctor account created.');
                setNewDoctor({ name: '', email: '', password: '' });
              }}>
                <label>Name<input required value={newDoctor.name} onChange={(event) => setNewDoctor({ ...newDoctor, name: event.target.value })} /></label>
                <label>Email<input type="email" required value={newDoctor.email} onChange={(event) => setNewDoctor({ ...newDoctor, email: event.target.value })} /></label>
                <label>Initial password<input type="password" minLength="12" maxLength="128" required value={newDoctor.password} onChange={(event) => setNewDoctor({ ...newDoctor, password: event.target.value })} /></label>
                <button className="button" disabled={busy} type="submit"><Plus size={16} /> Add doctor</button>
              </form>
              <div className="table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Email</th></tr></thead><tbody>
                {doctors.map((doctor) => <tr key={doctor._id}><td>{doctor.name}</td><td>{doctor.email}</td></tr>)}
              </tbody></table></div>
            </section>
          )}

          {user.role === 'admin' && (
            <section className="content-section">
              <SectionHeading eyebrow="Patient records" title="Patients" action={<span className="section-count"><Users size={15} /> {patients.length} records</span>} />
              <div className="table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>Actions</th></tr></thead><tbody>
                {patients.map((patient) => <tr key={patient._id}><td>{editingPatient?._id === patient._id ? <input aria-label="Patient name" value={editingPatient.name} onChange={(event) => setEditingPatient({ ...editingPatient, name: event.target.value })} /> : patient.name}</td><td>{editingPatient?._id === patient._id ? <input aria-label="Patient email" type="email" value={editingPatient.email} onChange={(event) => setEditingPatient({ ...editingPatient, email: event.target.value })} /> : patient.email}</td><td className="actions-cell">{editingPatient?._id === patient._id ? <><button className="text-button" onClick={() => runAction(async () => { await api.patch(`/admin/patients/${patient._id}`, editingPatient); setEditingPatient(null); }, 'Patient record updated.')}>Save</button><button className="text-button muted" onClick={() => setEditingPatient(null)}>Cancel</button></> : <><button className="text-button" onClick={() => setEditingPatient(patient)}>Edit</button><button className="text-button danger-text" onClick={() => { if (window.confirm(`Deactivate ${patient.name}'s account? Appointment history will be retained.`)) runAction(() => api.delete(`/admin/patients/${patient._id}`), 'Patient account deactivated; appointment history retained.'); }}>Deactivate</button></>}</td></tr>)}
              </tbody></table></div>
            </section>
          )}

          {(user.role === 'admin' || user.role === 'doctor') && (
            <section className="content-section">
              <SectionHeading eyebrow="Access control" title="Administrators" />
              <form className="admin-create-form" onSubmit={(event) => {
                event.preventDefault();
                runAction(() => api.post('/admin/admins', newAdmin), 'Administrator account created.');
                setNewAdmin({ name: '', email: '', password: '' });
              }}>
                <label>Name<input required value={newAdmin.name} onChange={(event) => setNewAdmin({ ...newAdmin, name: event.target.value })} /></label>
                <label>Email<input type="email" required value={newAdmin.email} onChange={(event) => setNewAdmin({ ...newAdmin, email: event.target.value })} /></label>
                <label>Initial password<input type="password" minLength="12" maxLength="128" required value={newAdmin.password} onChange={(event) => setNewAdmin({ ...newAdmin, password: event.target.value })} /></label>
                <button className="button" disabled={busy} type="submit"><Plus size={16} /> Add administrator</button>
              </form>
              <div className="table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>Actions</th></tr></thead><tbody>
                {admins.map((admin) => <tr key={admin._id}><td>{editingAdmin?._id === admin._id ? <input aria-label="Administrator name" value={editingAdmin.name} onChange={(event) => setEditingAdmin({ ...editingAdmin, name: event.target.value })} /> : admin.name}</td><td>{editingAdmin?._id === admin._id ? <input aria-label="Administrator email" type="email" value={editingAdmin.email} onChange={(event) => setEditingAdmin({ ...editingAdmin, email: event.target.value })} /> : admin.email}</td><td className="actions-cell">{editingAdmin?._id === admin._id ? <><button className="text-button" onClick={() => runAction(async () => { await api.patch(`/admin/admins/${admin._id}`, editingAdmin); setEditingAdmin(null); }, 'Administrator updated.')}>Save</button><button className="text-button muted" onClick={() => setEditingAdmin(null)}>Cancel</button></> : <><button className="text-button" onClick={() => setEditingAdmin(admin)}>Edit</button><button className="text-button danger-text" onClick={() => { if (window.confirm(`Remove administrator ${admin.name}?`)) runAction(() => api.delete(`/admin/admins/${admin._id}`), 'Administrator removed.'); }}>Remove</button></>}</td></tr>)}
              </tbody></table></div>
            </section>
          )}

          <footer className="workspace-footer"><span><Stethoscope size={15} /> {"Men's Clinic"} patient management</span><span>Clinical notes are visible only to authorized care teams and the patient.</span></footer>
        </div>
      </main>
    </div>
  );
}