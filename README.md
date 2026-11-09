
# TrustVault - Secure Document Sharing System

TrustVault is a secure document management and sharing application that allows users to upload, organize, access and share documents with controlled permissions.

## Project Overview

TrustVault provides role-based access control, document-level permissions and audit logging to improve document security and accountability.

## Technologies Used

### Frontend
- React
- Vite
- JavaScript
- HTML
- CSS

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcryptjs
- Multer

### Testing
- Node.js built-in test runner
- Supertest
- Thunder Client

## User Roles

| Role | Permissions |
|---|---|
| ADMIN | Administrative dashboard and user management |
| OWNER | Create, upload, update, delete and share own documents |
| VIEWER | Access documents explicitly shared with them |

## Main Features

1. User registration and login.
2. Password hashing.
3. JWT-based authentication.
4. Document creation and upload.
5. Document retrieval and management.
6. Document sharing with READ and EDIT permissions.
7. Permission revocation.
8. Server-side document authorization.
9. Document download.
10. Audit logging.
11. Admin dashboard and user management.
12. Account activation and deactivation.
13. HMAC-based audit record hashes.

## Permission Model

- Document owners automatically have full access to their documents.
- READ permission allows users to view and download shared documents.
- EDIT permission allows users to view and modify shared documents.
- Users without permission cannot access private documents.
- Revoked permissions are checked against the current database state on subsequent requests.

## Project Structure

```text
TrustVault/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   │
│   ├── src/test/
│   │   └── security.test.js
│   ├── uploads/
│   ├── .env
│   └── package.json
│
├── THREATS.md
├── PROMPTS.md
└── README.md
```

## Installation and Setup

### Prerequisites

- Node.js
- npm
- MongoDB Atlas account
- Git
- VS Code

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd TrustVault
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
MONGO_TEST_URI=your_separate_test_database_connection_string
JWT_SECRET=your_random_jwt_secret
CLIENT_URL=http://localhost:5173
AUDIT_SECRET=your_random_audit_secret
```

Never commit `.env` to GitHub.

### 3. Start backend

```bash
npm run dev
```

Backend URL:

http://localhost:5000

Health endpoint:

http://localhost:5000/api/health

### 4. Frontend setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

http://localhost:5173

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |

### Documents

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/documents | Create document |
| GET | /api/documents | Retrieve documents |
| POST | /api/documents/upload | Upload document |
| GET | /api/documents/:id | View document |
| PUT | /api/documents/:id | Update document |
| DELETE | /api/documents/:id | Delete document |
| GET | /api/documents/:id/download | Download document |
| POST | /api/documents/:id/share | Grant access |
| DELETE | /api/documents/:id/share | Revoke access |
| GET | /api/documents/:id/audit-logs | View document audit logs |

### Administration

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/admin/dashboard | Admin dashboard |
| GET | /api/admin/users | Manage users |
| PATCH | /api/admin/users/:id/status | Activate or deactivate user |

All protected endpoints require a valid JWT access token unless otherwise specified.

## Automated Security Testing

Run the automated tests from the backend folder:

```bash
npm test
```

Latest verified test result:

- Total tests: 7
- Passed: 7
- Failed: 0

Tests cover authentication, document ownership, unauthorized access, READ and EDIT permissions, permission revocation and audit records.

Tests use a separate MongoDB test database. Never configure the test URI to point to the production database.

## Security Documentation

See:

- [THREATS.md](THREATS.md) - Security threats, mitigations and accepted risks.
- [PROMPTS.md](PROMPTS.md) - AI prompts, corrections and development reflection.

## Current Limitations

- Existing audit records created before hash protection was introduced are not retroactively protected.
- Audit-chain concurrency and independent verification require additional hardening.
- Production deployment and external security testing remain future improvements.

## Future Improvements

- Stronger audit-chain verification.
- Rate limiting.
- Enhanced file-upload validation.
- Automated upload and download security tests.
- Production deployment.
- Security monitoring.

## Author

Developed as a secure document-sharing project for the Snovasys hiring challenge.
