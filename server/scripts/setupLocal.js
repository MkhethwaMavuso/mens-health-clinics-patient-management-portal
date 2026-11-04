import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspaceDirectory = resolve(serverDirectory, '..');
const configurations = [
  {
    path: resolve(serverDirectory, '.env'),
    contents: [
      'NODE_ENV=development',
      'PORT=5000',
      'MONGO_URI=mongodb://127.0.0.1:27017/mens-clinic',
      `JWT_SECRET=${randomBytes(48).toString('hex')}`,
      'CLIENT_URL=http://localhost:5173',
      "CLINIC_NAME=Men's Clinic",
      'CLINIC_ADDRESS=',
      'CLINIC_TIME_ZONE=UTC',
      'SMTP_HOST=',
      'SMTP_PORT=587',
      'SMTP_SECURE=false',
      'SMTP_USER=',
      'SMTP_PASS=',
      'MAIL_FROM=appointments@example.com',
      ''
    ].join('\n')
  },
  {
    path: resolve(workspaceDirectory, 'client', '.env'),
    contents: 'VITE_API_URL=http://localhost:5000/api\n'
  }
];

for (const configuration of configurations) {
  await mkdir(dirname(configuration.path), { recursive: true });
  try {
    await writeFile(configuration.path, configuration.contents, { flag: 'wx', mode: 0o600 });
    console.info(`Created ${configuration.path}`);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    console.info(`Kept existing ${configuration.path}`);
  }
}

console.info('Local environment is ready; generated secrets were not displayed.');