# Men's Clinic Management & Booking Portal

A role-based clinic portal for patient appointment booking, reception workflows, and doctor consultations. The repository is a monorepo with independently deployable `client` and `server` packages.

## Features

- Patient self-registration, sign-in, appointment booking, and session history.
- Admin reception tools for walk-ins, patient records, clinician assignment, and check-in.
- Doctor workspace for assigned appointments and clinical notes (symptoms, diagnosis, treatment, and medication).
- Admin and doctor management of administrator accounts; initial privileged access is provisioned out-of-band.
- HTTP-only JWT session cookies, bcrypt password hashing, role-based API authorization, request rate limiting, and Helmet security headers.
- Email confirmations and walk-in account setup links through SMTP/Nodemailer.

## Requirements

- Node.js 20 or newer and npm.
- MongoDB (local, Atlas, or another managed MongoDB service).
- SMTP credentials for email delivery. Email is optional for local UI development; booking records are still created if SMTP is unavailable.

## Local Development

1. Configure the API:

	```sh
	cd server
	cp .env.example .env
	```

	Set `MONGO_URI` and a randomly generated `JWT_SECRET` of at least 32 characters. Configure SMTP to deliver emails. Set `CLINIC_TIME_ZONE` to the clinic's IANA time zone (for example, `America/New_York`) so appointment emails show the right local time.

2. Install dependencies and create the first administrator:

	```sh
	npm install
	ADMIN_NAME="Clinic Administrator" ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="use-a-unique-password-of-12-chars-or-more" npm run create-admin
	```

	This command refuses to create another initial admin if one already exists. Do not commit `.env` files or pass production credentials in shared shell history.

3. Start the API in one terminal:

	```sh
	npm run dev
	```

4. Configure and start the client in a second terminal:

	```sh
	cd ../client
	cp .env.example .env
	npm install
	npm run dev
	```

	Open `http://localhost:5173`. Patient accounts can be registered from the sign-in screen. Admin and doctor accounts must be created by an administrator or doctor; the initial administrator is created with the script above.

## Environment Variables

### API (`server/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | No | Use `production` for deployment. |
| `PORT` | No | API port; defaults to `5000`. |
| `MONGO_URI` | Yes | MongoDB connection string. |
| `JWT_SECRET` | Yes | At least 32 characters of high-entropy secret material. |
| `CLIENT_URL` | Yes for deployment | Exact allowed client origin; multiple comma-separated origins are supported. |
| `CLINIC_NAME` | No | Name used in patient emails. |
| `CLINIC_ADDRESS` | No | Address included in appointment emails. |
| `CLINIC_TIME_ZONE` | No | IANA time zone for appointment emails; defaults to UTC. |
| `SMTP_HOST` | For email | SMTP server hostname. When omitted, email is not sent. |
| `SMTP_PORT` | For email | SMTP port; defaults to `587`. |
| `SMTP_SECURE` | No | Set `true` for implicit TLS (commonly port `465`). |
| `SMTP_USER` / `SMTP_PASS` | Depends on provider | SMTP authentication. |
| `MAIL_FROM` | For email | Verified sender address. |

### Client (`client/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Yes for deployment | API base URL including `/api`, e.g. `https://clinic-api.example.com/api`. |

## API Overview

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/activate`
- `GET /api/appointments`, `POST /api/appointments`
- `PATCH /api/appointments/:id/arrived`, `PATCH /api/appointments/:id/assign`, `PATCH /api/appointments/:id/complete`
- `/api/admin/patients` for admin patient record listing, editing, and deletion
- `POST /api/admin/walk-ins` for admin-assisted patient creation and an immediately arrived appointment
- `/api/admin/admins` for administrator CRUD by admins and doctors; `/api/admin/doctors` for admin doctor provisioning and clinician assignment
- `GET /api/health` for service health

All API routes use JSON. Session cookies are HTTP-only; production cookies require HTTPS. Appointment state transitions are enforced by the API: patient bookings start as `Booked`, reception can move them to `Arrived`, and the assigned doctor can complete an arrived session with all four clinical note fields. Reception appointment results omit clinical notes. Deactivating a patient prevents further sign-in but retains appointment history.

## Deployment

### Backend (Render or Railway)

1. Create a Node service with the repository root directory set to `server`.
2. Use Node 20+, install with `npm install`, and start with `npm start`.
3. Add the API environment variables above. Use a managed MongoDB service and restrict its network access to the application where supported.
4. Set `CLIENT_URL` to the deployed frontend origin and configure a production `JWT_SECRET`, SMTP credentials, and clinic time zone.
5. Run the initial admin command as a one-off job with `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `MONGO_URI` set. Remove the bootstrap credentials after use.

### Frontend (Vercel)

1. Import the repository and set the project root to `client`.
2. Use `npm run build` as the build command and `dist` as the output directory.
3. Set `VITE_API_URL` to the deployed API URL ending in `/api`.
4. Add the final Vercel origin to the API's `CLIENT_URL` and redeploy the API.

The API uses credentialed CORS and `SameSite=None; Secure` cookies in production for separate frontend/backend origins. Use HTTPS for both services. For environments that restrict cross-site cookies, place the API and client behind a shared site/custom domain or use a same-origin reverse proxy.

## Privacy and Operations

Walk-in email contains appointment logistics and a single-use account activation link that expires after 24 hours; it does not email a reusable password. Clinical notes are excluded from email. SMTP delivery failures are logged without cancelling a saved appointment, so production deployments should monitor API logs and verify email delivery. Configure backups, access controls, retention, audit requirements, and applicable healthcare privacy agreements before using real patient data; this starter does not itself certify regulatory compliance.

The included tests are `node --test` in `server`; the client production bundle can be checked with `npm run build` in `client`.