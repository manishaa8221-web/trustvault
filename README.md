# TrustVault

Secure Document Sharing Platform built using the MERN stack.

## Features

- User Registration
- User Login
- Password Hashing using bcrypt
- JWT Authentication
- Role-Based Access Control
- Document Management
- Permission Management
- Audit Logging
- Admin Dashboard

## Roles

### ADMIN
- Manage users
- Monitor audit logs
- View dashboard

### OWNER
- Create documents
- Manage document permissions

### VIEWER
- Read shared documents

## Tech Stack

### Frontend
- React
- React Router
- Vite

### Backend
- Node.js
- Express.js

### Database
- MongoDB Atlas
- Mongoose

### Security
- bcryptjs
- JSON Web Token (JWT)

## Project Architecture

Frontend (React)
↓
Backend (Express)
↓
MongoDB Atlas

Authentication:
- Register
- Login
- JWT

Authorization:
- Admin
- Owner
- Viewer

Modules:
- Users
- Documents
- Permissions
- Audit Logs
- Admin Dashboard
