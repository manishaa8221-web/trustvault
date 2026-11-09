# TrustVault - AI Usage and Prompt Log

## Project Overview

TrustVault is a secure document-sharing application developed using React, Node.js, Express and MongoDB.

AI assistance was used for understanding requirements, debugging, implementation guidance, security improvements and testing.

## Prompt 1 - Project Setup

**Date:** 2026-11-01

**Prompt:**
Help me build TrustVault using beginner-friendly steps with Node.js, Express, MongoDB and React.

**AI Output:**
Provided project structure, installation commands and initial backend setup.

**What was wrong or incomplete:**
Some setup instructions needed adjustment for my Windows environment.

**What I did instead:**
Created the frontend and backend folders in VS Code and verified the server locally.

## Prompt 2 - User Authentication

**Date:** 2026-11-04

**Prompt:**
Help me implement user registration and login using Express, bcrypt and JWT.

**AI Output:**
Suggested authentication controllers, password hashing and JWT generation.

**What was wrong or incomplete:**
Initial route and frontend connections needed additional debugging.

**What I did instead:**
Updated the authentication files and tested registration and login using Thunder Client.

## Prompt 3 - Document Permissions

**Date:** 2026-11-07

**Prompt:**
Implement document access control so that owners can share documents with READ and EDIT permissions.

**AI Output:**
Suggested permission middleware and document-sharing routes.

**What was wrong or incomplete:**
Access control needed to verify permissions on every request.

**What I did instead:**
Implemented server-side document authorization and tested owner, READ and EDIT behavior.

## Prompt 4 - Audit Logging and Access Control

**Date:** 2026-11-08

**Prompt:**
Help me record successful and denied document access attempts in an audit log.

**AI Output:**
Suggested audit logging for document operations and permission changes.

**What was wrong or incomplete:**
The initial logging approach did not provide hash-based integrity protection.

**What I did instead:**
Added HMAC-based audit hashes and protected audit records against normal Mongoose update and delete operations. I also documented remaining integrity limitations.

## Prompt 5 - Security Testing

**Date:** 2026-11-09

**Prompt:**
Help me write automated security tests proving that one user cannot access another user's documents.

**AI Output:**
Suggested Node.js test runner and Supertest integration tests.

**What was wrong or incomplete:**
Initial tests had incorrect file import paths and the audit secret was too short.

**What I did instead:**
Corrected the import paths, configured a separate test database, generated a stronger audit secret and reran the tests.

**Verified result:**
7 tests passed and 0 failed.

## AI Usage Reflection

AI helped me understand unfamiliar technologies, debug errors and implement security features.

I reviewed the suggested code, made corrections, ran the application and verified important functionality using Thunder Client and automated tests.

I learned about JWT authentication, MongoDB models, document permissions, audit logging and automated security testing.

## 

