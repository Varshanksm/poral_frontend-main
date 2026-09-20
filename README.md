# Hackathon Management Portal — Frontend

A React-based frontend for managing student hackathon participation, verification, tracking, and reporting for the Department of Computer Science and Business Systems, Thiagarajar College of Engineering.

## Overview

The application provides separate interfaces for students, proctors, and administrators, with role-specific workflows for submitting, reviewing, and managing hackathon participation.

## Key Features

- Student registration and login
- Hackathon submission with certificate upload
- Participation history and status tracking
- Proctor dashboard for submission verification
- Accept/reject workflow with feedback
- Admin dashboard with participation statistics
- Year-wise and mode-wise participation views
- CSV reporting support
- Email-driven status notifications through the backend

## Technology Stack

- **React**
- **Vite**
- **JavaScript**
- **CSS3**
- **Axios** — API communication
- **Recharts** — dashboard visualisation

## Application Structure

```text
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── context/
│   └── services/
├── public/
└── package.json
```

## Local Development

### Prerequisites

- Node.js 16+
- Running instance of the companion backend API

### Setup

```bash
git clone https://github.com/GOBINATHKANNAN/hacathon_portal_frontend.git
cd hacathon_portal_frontend
npm install
npm run dev
```

The Vite development server will provide the local application URL in the terminal.

## Backend Integration

The frontend communicates with the project backend through REST APIs for authentication, hackathon submissions, user management, review workflows, and reporting.

Companion repository:

`GOBINATHKANNAN/Hacathon_portal_backend`

## Engineering Focus

This project demonstrates component-based UI development, client-side state management, REST API integration, role-based application flows, dashboard visualisation, and practical frontend architecture.

## Project Context

**Academic Project — Thiagarajar College of Engineering**  
Department of Computer Science and Business Systems
