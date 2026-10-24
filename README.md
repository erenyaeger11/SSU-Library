# Page & Pine Library Visitor System

A school-library visitor logbook replacement with a React/Vite staff portal and a separate PHP 8+ / MySQL API. React never connects directly to MySQL. QR passes contain only an identifier (`SSU-<student ID>`); student details stay in MySQL.

## Requirements

- Node.js 20+ and npm
- XAMPP with Apache, MySQL, and PHP 8+ (`pdo_mysql`)
- A webcam and a modern browser; webcam access requires localhost or HTTPS

## 1. Database and API setup

1. Start Apache and MySQL from the XAMPP Control Panel.
2. Open phpMyAdmin at `http://localhost/phpmyadmin`, import `database/schema.sql`, and confirm the `library_visitors` database exists.
3. Copy `api/config.example.php` to `api/config.php`. Set the MySQL username/password, timezone, and exact frontend origins. Do not commit `api/config.php`.
4. Start the frontend and PHP API together from the project directory:

   ```powershell
   npm.cmd run dev
   ```

   This starts the PHP API and Vite together, and stops the API when the development server exits. PHP is detected from `C:\xampp\php\php.exe` or your `PATH`; set `PHP_BINARY_PATH` if PHP is installed elsewhere. Vite forwards `/api/*` requests to the local API.
5. Create the requested initial admin account once after configuring the database. In PowerShell, enter the initial password when prompted, run the seeder, then remove the temporary environment variable:

   ```powershell
   $env:LIBRARY_ADMIN_PASSWORD = Read-Host "Initial admin password"
   try {
     C:\xampp\php\php.exe database\seed_admin.php
   } finally {
     Remove-Item Env:LIBRARY_ADMIN_PASSWORD
   }
   ```

   Use **admin@ssu.com** as the login email and enter the requested initial password at the prompt. It is hashed in MySQL and is never stored in the project files. Because this is a temporary weak password, the account is restricted to Settings until a unique password of at least 12 characters is chosen. The seeder refuses to run if any admin account already exists.

   To create a different staff account instead, use:

   ```powershell
   C:\xampp\php\php.exe database\create_admin.php
   ```

   Choose a unique username/email and a strong password of at least 12 characters. Passwords are stored using `password_hash()`.

   If you already have an account but its password is no longer accepted, reset that account without putting the new password in chat or command history. Run this from PowerShell in the project directory, then enter the account email and choose a new password when prompted:

   ```powershell
   .\database\reset_admin_password.ps1
   ```

   The reset utility updates only a matching active account, stores the password as a hash, and verifies the updated hash before reporting success. From Git Bash, launch the PowerShell script with `powershell.exe -NoProfile -ExecutionPolicy Bypass -File database/reset_admin_password.ps1`.

## 2. Frontend development

From the project directory, start the frontend and API together:

```powershell
npm.cmd run dev
```

Open the Vite URL (usually `http://localhost:5173`). Keep this command running while using the app. The API allow-list includes both `localhost` and `127.0.0.1` development origins.

For a production build:

```powershell
npm.cmd run build
```

Copy the contents of `dist` into `C:\xampp\htdocs\library` beside the `api` folder, and configure Apache to serve the React `index.html` for application routes while leaving `/api` paths to PHP. Serve production over HTTPS so webcam access works outside localhost. Set `session_secure` to `true` in `api/config.php` when HTTPS is enabled.

## Features

- PHP-session staff authentication, protected routes, first-login password rotation, password hashing and origin allow-list
- Student create/list/search/edit/deactivate/delete flows, server-generated unique QR identifiers, QR view and print
- Webcam QR scanner (`html5-qrcode`), active-student lookup, purpose selection and server-timestamped visit creation
- Two-minute per-student duplicate check enforced by the API
- Dashboard visitor totals and weekly trend, visitor filters/pagination, report charts and CSV downloads
- MySQL foreign keys retain visit history; hard deletion is refused where a student has logs

## API

All API responses are JSON except the authenticated CSV export. Copy `api/config.example.php` to the untracked `api/config.php` before making requests.

- `POST /api/auth/login.php`, `GET /api/auth/me.php`, `POST /api/auth/logout.php`
- `GET /api/students/list.php`, `GET /api/students/get.php?id=SSU-2025-00123`
- `POST /api/students/create.php`, `POST /api/students/update.php`, `POST /api/students/delete.php`
- `POST /api/visitor-logs/create.php`, `GET /api/visitor-logs/list.php`
- `GET /api/reports/dashboard.php`, `GET /api/reports/analytics.php?period=month`
- `GET /api/reports/export.php?period=month`

All data endpoints require an active staff session. State-changing requests must be same-origin or from a configured allowed origin; session cookies are HttpOnly and SameSite Strict.

## Operational notes

- Use a least-privilege MySQL account in production instead of the XAMPP root account.
- Back up the database regularly and restrict access to the API/config file and database.
- Set `session_secure` to `true` over HTTPS and remove unused development origins from the allow-list.
- Webcam camera permissions are requested by the browser when staff start scanning.
