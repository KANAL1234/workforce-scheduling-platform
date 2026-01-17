# Workforce Scheduling Platform

A robust, data-driven platform designed to automate and optimize employee shift scheduling. Built with a focus on operational efficiency, fairness, and modern user experience.

## 🚀 Overview

This platform solves the complex "Shift Scheduling Problem" by balancing organizational requirements with employee preferences. It leverages advanced optimization algorithms to create schedules that are both logistically sound and worker-friendly.

- **Frontend:** Modern SPA built with **React**, **Vite**, and **Tailwind CSS**.
- **Backend:** High-performance REST API powered by **FastAPI** and **Python 3.13**.
- **Optimization:** Intelligent shift assignment using **Google OR-Tools** (Constraint Programming).
- **Database:** Reliable relational data management with **PostgreSQL**.

---

## ✅ Core Features

- **Intelligent Auto-Scheduling:** Automated shift assignments based on availability, required staffing, and fairness constraints.
- **Admin Dashboard:** Comprehensive management of students, shifts, and published schedules with real-time analytics.
- **Student Portal:** Personalized view of assigned shifts and easy availability submission.
- **Role-Based Access:** Secure authentication and authorization (JWT) for Admins and Students.

*For a full list of features, see [FEATURES.md](docs/FEATURES.md).*

---

## 🏗️ Architecture

The system follows a decoupled client-server architecture:
- **Presentation Layer:** Responsive React frontend.
- **Business Logic:** FastAPI backend executing optimization logic and data processing.
- **Persistence Layer:** PostgreSQL database with SQLAlchemy ORM.

*Detailed technical design can be found in [ARCHITECTURE.md](docs/ARCHITECTURE.md).*

---

## 🛠️ Getting Started

The project is split into two main components:

### Backend (FastAPI)
- Located in the `/backend` directory.
- Requires Python 3.13 and dependencies in `requirements.txt`.
- Set up your `.env` file based on `.env.example`.

### Frontend (React)
- Located in the `/frontend` directory.
- Requires Node.js 18+.
- Run `npm install` and `npm run dev` to start.

---

## 🔐 Security & Standards
- Secure JWT-based authentication.
- BCrypt salted password hashing.
- Granular RBAC (Role-Based Access Control).

---

**Last Updated:** January 17, 2026  
**License:** [MIT](LICENSE)
