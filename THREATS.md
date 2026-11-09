
# TrustVault - Security Threat Model

## 1. Project Overview

TrustVault is a secure document-sharing application built with Node.js, Express, MongoDB, React and JWT authentication.

It supports three roles:
- ADMIN
- OWNER
- VIEWER

Document owners can grant READ or EDIT permissions to other users.

## 2. Identified Threats and Mitigations

### Threat 1: Unauthorized Document Access

**Risk:** An unapproved user may try to access another user's private document.

**Mitigation:**
- Authentication middleware protects document routes.
- Document access middleware checks ownership and permissions.
- Unauthorized access attempts are rejected with HTTP 403.
- Denied access attempts are recorded in audit logs.

### Threat 2: Privilege Escalation

**Risk:** A user may attempt to gain administrator or owner privileges.

**Mitigation:**
- User roles are stored in MongoDB.
- Authentication middleware retrieves the current role from the database.
- The role stored in an old JWT is not trusted as the current role.
- Role-protected routes restrict administrative operations.

### Threat 3: Unauthorized Document Editing

**Risk:** A READ-only user may attempt to modify a document.

**Mitigation:**
- Editing requires EDIT permission.
- Owners automatically have full access to their documents.
- READ permission does not grant editing rights.
- Unauthorized edit attempts are rejected.

### Threat 4: Permission Revocation Abuse

**Risk:** A previously authorized user may continue accessing a document after permission is revoked.

**Mitigation:**
- Permissions are checked against the current database record.
- Access is not based only on previously issued JWT tokens.
- Revoked permissions are checked on subsequent requests.

### Threat 5: Inactive Account Abuse

**Risk:** A deactivated account may attempt to continue using the application.

**Mitigation:**
- Authentication middleware checks the user's current active status.
- Deactivated users are denied access.

### Threat 6: Audit Log Tampering

**Risk:** An attacker may attempt to modify or delete audit records.

**Mitigation:**
- Audit records include HMAC-based hashes.
- Audit records are protected against normal Mongoose update and delete operations.
- The audit secret is stored in environment configuration and must not be committed to GitHub.

**Limitation:** Existing audit records created before hash protection was introduced are not retroactively protected. Hash chaining also requires additional concurrency and independent verification controls before it can be considered tamper-proof.

### Threat 7: Malicious File Uploads

**Risk:** An attacker may upload an unsafe or unexpected file.

**Mitigation:**
- File-upload middleware is used to process uploads.
- File type, size and storage validation must be enforced.
- Uploaded files should not be executed as application code.

### Threat 8: Credential Exposure

**Risk:** Database credentials or authentication secrets may be exposed.

**Mitigation:**
- Environment variables are used for sensitive configuration.
- `.env` must be excluded from version control.
- Strong secrets and password rotation are recommended.

## 3. Security Testing

Automated tests were executed using Node.js's built-in test runner and Supertest.

Verified results:
- Unauthenticated users cannot read documents.
- Document owners can read their documents.
- Unshared users cannot read another user's documents.
- READ permission does not allow editing.
- Revoked permission immediately blocks subsequent reads.
- Denied access creates hashed audit records.

Latest test result: 7 passed, 0 failed.

## 4. Accepted Risks and Limitations

- Previously created audit logs do not automatically gain hashes.
- HMAC audit protection depends on keeping the secret secure.
- Concurrent audit writes and independent hash-chain verification need further hardening.
- File-upload security requires continued validation and testing.
- Production deployment should use HTTPS, secure configuration and regular backups.

## 5. Future Security Improvements

- Add automated tests for upload validation and download authorization.
- Add independent audit-chain verification.
- Add rate limiting for authentication endpoints.
- Add security monitoring and alerts.
- Conduct penetration testing before production deployment.
