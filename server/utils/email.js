import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      } : undefined
    });
  }
  return transporter;
}

function appointmentDetails(appointment) {
  const date = new Intl.DateTimeFormat('en', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: process.env.CLINIC_TIME_ZONE || 'UTC'
  }).format(appointment.appointmentDate);
  return `${date}${process.env.CLINIC_ADDRESS ? `\n${process.env.CLINIC_ADDRESS}` : ''}`;
}

async function sendMail(message) {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn('Email is not configured; notification was not sent');
    return;
  }
  await mailer.sendMail({ from: process.env.MAIL_FROM, ...message });
}

export async function sendBookingConfirmation(user, appointment) {
  await sendMail({
    to: user.email,
    subject: `${process.env.CLINIC_NAME || "Men's Clinic"}: appointment confirmed`,
    text: `Hello ${user.name},\n\nYour appointment is booked for:\n${appointmentDetails(appointment)}\n\nPlease contact the clinic if you need to make a change.`
  });
}

export async function sendWalkInActivation(user, appointment, token) {
  const activationUrl = `${process.env.CLIENT_URL}/activate?token=${encodeURIComponent(token)}`;
  await sendMail({
    to: user.email,
    subject: `${process.env.CLINIC_NAME || "Men's Clinic"}: appointment and account setup`,
    text: `Hello ${user.name},\n\nYour clinic account and appointment are ready. Appointment:\n${appointmentDetails(appointment)}\n\nSet a private password using this one-time link (expires in 24 hours):\n${activationUrl}\n\nIf you did not expect this message, contact the clinic.`
  });
}