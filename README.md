# 🚀 Secure Task Management System

A full-stack **Task Management System** built with **NX Monorepo**, **NestJS**, and **Angular**.  
Features **JWT-based authentication**, **Role-Based Access Control (RBAC)**, and a **modern responsive UI**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)
![NX](https://img.shields.io/badge/NX-monorepo-purple.svg)

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Setup Instructions](#-setup-instructions)
- [API Documentation](#-api-documentation)
- [Data Models](#-data-models)
- [Access Control](#-access-control)
- [Testing](#-testing)

---

## 🎯 Overview

This project demonstrates a secure, production-ready task management system with:

- **JWT-based Authentication** - Real authentication, no mocks
- **Role-Based Access Control** - Owner, Admin, Viewer roles with hierarchical permissions
- **Organization Hierarchy** - Two-level organization model
- **Audit Logging** - Track all user actions
- **Modern UI** - Responsive dashboard with drag-and-drop, dark mode, and filtering

---

## ✨ Features

### Backend
- ✅ JWT Authentication with secure token handling
- ✅ RBAC with role inheritance (Owner > Admin > Viewer)
- ✅ Organization-scoped task visibility
- ✅ Audit logging for all operations
- ✅ Input validation and error handling
- ✅ TypeORM with SQLite (PostgreSQL compatible)

### Frontend
- ✅ Modern Angular 19+ with standalone components
- ✅ Kanban board with drag-and-drop
- ✅ Dark/Light mode toggle
- ✅ Responsive design (mobile → desktop)
- ✅ Task filtering and search
- ✅ Progress visualization

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|------------|
| **Monorepo** | NX Workspace |
| **Backend** | NestJS, TypeORM, SQLite |
| **Frontend** | Angular 19, TailwindCSS, Angular CDK |
| **Authentication** | JWT, Passport.js |
| **Testing** | Jest |

---

## 🏗 Architecture

### NX Monorepo Structure

```
task-management/
│
├── apps/
│   │
│   ├── api/                         # NestJS Backend
│   │   └── src/
│   │       └── app/
│   │           ├── auth/            # Authentication module
│   │           ├── tasks/           # Tasks CRUD module
│   │           ├── audit/           # Audit logging module
│   │           ├── database/        # Database seeding
│   │           └── entities/        # TypeORM entities
│   │
│   └── dashboard/                   # Angular Frontend
│       └── src/
│           └── app/
│               ├── core/            # Services, guards, interceptors
│               └── features/        # Login, Dashboard, Audit Log
│
└── libs/
    ├── data/                        # Shared TypeScript interfaces & DTOs
    └── auth/                        # Shared RBAC logic
```

### Why This Structure?

1. **Separation of Concerns** - Each module has a single responsibility
2. **Code Reuse** - Shared libraries for data contracts and auth logic
3. **Scalability** - Easy to add new apps or libraries
4. **Type Safety** - Shared interfaces ensure consistency

---

## ⚙️ Setup Instructions

### Prerequisites

- Node.js >= 18
- npm or yarn
- NX CLI (optional, npx works)

### Installation

\`\`\`bash
# Clone the repository
cd task-management

# Install dependencies
npm install
\`\`\`

### Environment Configuration

Create a \`.env\` file in the root directory:

\`\`\`env
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h
DATABASE_TYPE=sqlite
DATABASE_NAME=task-manager.db
NODE_ENV=development
PORT=3000
\`\`\`

### Running the Application

**Start Backend:**
\`\`\`bash
npx nx serve api
\`\`\`
Backend runs at: http://localhost:3000/api

**Start Frontend:**
\`\`\`bash
npx nx serve dashboard
\`\`\`
Frontend runs at: http://localhost:4200

### Demo Accounts

The database is automatically seeded with test accounts:

| Role | Email | Password |
|------|-------|----------|
| **Owner** | owner@acme.com | password123 |
| **Admin** | admin@engineering.com | password123 |
| **Admin** | admin@marketing.com | password123 |
| **Viewer** | viewer@engineering.com | password123 |
| **Viewer** | viewer@marketing.com | password123 |

---

## 📡 API Documentation

### Authentication

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request:**
\`\`\`json
{
  "email": "owner@acme.com",
  "password": "password123"
}
\`\`\`

**Response:**
\`\`\`json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "owner@acme.com",
    "firstName": "John",
    "lastName": "Owner",
    "role": "owner",
    "organizationId": "uuid"
  }
}
\`\`\`

### Tasks

All task endpoints require JWT authentication via \`Authorization: Bearer <token>\` header.

#### POST /api/tasks
Create a new task.

#### GET /api/tasks
List accessible tasks (scoped by role and organization).

#### PUT /api/tasks/:id
Update a task (requires permission).

#### DELETE /api/tasks/:id
Delete a task (requires permission).

### Audit Log

#### GET /api/audit-log
View audit logs (Owner/Admin only).

---

## 🧠 Data Models

### Entity Relationship

- **Organization** - Has parent/child relationship (2-level hierarchy)
- **User** - Belongs to organization, has role
- **Task** - Owned by user, scoped to organization
- **AuditLog** - Records all user actions

### Enums

**Role:** owner, admin, viewer  
**TaskStatus:** todo, in_progress, done  
**TaskCategory:** work, personal, shopping, health, finance, other

---

## 🔐 Access Control

### Role Hierarchy

| Role | Level | Permissions |
|------|-------|-------------|
| Owner | 3 | Full access to org hierarchy |
| Admin | 2 | Manage tasks in same org |
| Viewer | 1 | Read only own tasks |

### Permission Matrix

| Action | Owner | Admin | Viewer |
|--------|-------|-------|--------|
| Create Task | ✅ | ✅ | ❌ |
| Read Own Tasks | ✅ | ✅ | ✅ |
| Read Org Tasks | ✅ | ✅ | ❌ |
| Update Tasks | ✅ | ✅ | ❌ |
| Delete Own Tasks | ✅ | ✅ | ❌ |
| Delete Org Tasks | ✅ | ❌ | ❌ |
| View Audit Log | ✅ | ✅ | ❌ |

---

## 🧪 Testing

\`\`\`bash
# Run backend tests
npx nx test api

# Run frontend tests
npx nx test dashboard
\`\`\`
