import { useState } from 'react';
import { Check, ClipboardList } from 'lucide-react';

const noteFields = [
  ['symptoms', 'Symptoms'],
  ['diagnosis', 'Diagnosis'],
  ['treatment', 'Treatment'],
  ['medication', 'Prescribed medication']
];

function displayDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export default function AppointmentTable({ appointments, role, doctors = [], onArrived, onAssign, onComplete }) {
  const [notes, setNotes] = useState({});

  if (!appointments.length) {
    return <p className="empty-state">No appointments to show yet.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Appointment</th>
            {role !== 'patient' && <th>Patient</th>}
            {role !== 'doctor' && <th>Clinician</th>}
            <th>Status</th>
            {role === 'doctor' && <th>Consultation</th>}
            {role === 'admin' && <th>Reception</th>}
          </tr>
        </thead>
        <tbody>
          {appointments.map((appointment) => (
            <tr key={appointment._id}>
              <td>
                <strong>{displayDate(appointment.appointmentDate)}</strong>
                {role === 'patient' && appointment.status === 'Complete' && (
                  <details className="notes-details">
                    <summary>Session notes</summary>
                    {noteFields.map(([key, label]) => (
                      <p key={key}><b>{label}:</b> {appointment.clinicalNotes?.[key] || 'Not recorded'}</p>
                    ))}
                  </details>
                )}
              </td>
              {role !== 'patient' && <td>{appointment.patient?.name || 'Patient'}</td>}
              {role !== 'doctor' && (
                <td>
                  {role === 'admin' && appointment.status !== 'Complete' ? (
                    <select
                      aria-label={`Assign doctor for ${appointment.patient?.name || 'patient'}`}
                      value={appointment.doctor?._id || ''}
                      onChange={(event) => onAssign(appointment._id, event.target.value)}
                    >
                      <option value="" disabled>Unassigned</option>
                      {doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>{doctor.name}</option>)}
                    </select>
                  ) : appointment.doctor?.name || 'Unassigned'}
                </td>
              )}
              <td><span className={`status status-${appointment.status.toLowerCase()}`}>{appointment.status}</span></td>
              {role === 'admin' && (
                <td>
                  {appointment.status === 'Booked' ? (
                    <button className="icon-button" title="Mark patient arrived" onClick={() => onArrived(appointment._id)}>
                      <Check size={17} /> <span>Arrived</span>
                    </button>
                  ) : <span className="muted">{appointment.status === 'Complete' ? 'Closed' : 'Checked in'}</span>}
                </td>
              )}
              {role === 'doctor' && (
                <td className="consultation-cell">
                  {appointment.status === 'Arrived' ? (
                    <form onSubmit={(event) => {
                      event.preventDefault();
                      onComplete(appointment._id, notes[appointment._id] || appointment.clinicalNotes || {});
                    }}>
                      {noteFields.map(([key, label]) => (
                        <label key={key}>
                          {label}
                          <textarea
                            required
                            maxLength={5000}
                            rows="2"
                            value={notes[appointment._id]?.[key] ?? appointment.clinicalNotes?.[key] ?? ''}
                            onChange={(event) => setNotes((current) => ({
                              ...current,
                              [appointment._id]: { ...current[appointment._id], [key]: event.target.value }
                            }))}
                          />
                        </label>
                      ))}
                      <button className="button button-small" type="submit"><ClipboardList size={15} /> Complete session</button>
                    </form>
                  ) : <span className="muted">{appointment.status === 'Complete' ? 'Notes saved' : 'Awaiting check-in'}</span>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}