# 🌌 OrbitFlow 

OrbitFlow is a premium, full-stack enterprise project management platform designed to streamline team collaboration, task tracking, and administrative control. Built with modern web technologies, OrbitFlow offers a sleek, dynamic interface powered by robust backend security and role-based access controls.

---

## ✨ Key Features

### 🏢 Enterprise-Grade Administration
- **Admin-Managed Provisioning:** Public signups are disabled. Global Administrators have an exclusive dashboard to provision, edit, and remove team members.
- **Role-Based Access Control (RBAC):** Strict separation between Global Admins, Project Admins, and standard Members.
- **Mandatory Security Flow:** Newly created accounts are given temporary passwords and are forced to securely update their password upon their first login.
- **Instant Password Reset:** Admins can instantly invalidate a user's active sessions and generate a new temporary password from the dashboard.

### 📋 Interactive Kanban Boards
- **Drag-and-Drop Tasks:** Fluid, hardware-accelerated drag-and-drop powered by `@dnd-kit`.
- **Real-time Optimistic Updates:** Changes are instantly reflected in the UI while seamlessly syncing with the backend in the background.

### 🎯 Project & Task Management
- **Project Workspaces:** Create custom projects with unique emojis, colors, and due dates.
- **Team Management:** Invite specific organization members to projects and assign project-level roles.
- **Task Assignment:** Create detailed tasks with priorities (Low, Medium, High, Critical), descriptions, and deadlines.
- **Smart Permissions:** Members can view the entire project board to stay aligned, but the backend strictly ensures they can only edit their own assigned work.

### 🎨 Premium Aesthetics
- **Dynamic UI:** Fluid micro-animations with `framer-motion` provide a highly responsive feel.
- **Dark Mode Tailored:** A carefully curated, glassmorphism-inspired dark theme for a modern aesthetic.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS, `clsx`, `tailwind-merge`
- **State & Data Fetching:** `@tanstack/react-query`
- **Animations:** Framer Motion
- **Drag & Drop:** `@dnd-kit/core` & `@dnd-kit/sortable`
- **Routing:** React Router DOM

### Backend
- **Environment:** Node.js & Express
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (JSON Web Tokens) & bcrypt
- **Security:** `express-rate-limit`, `helmet`, CORS
- **Validation:** Zod

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL instance running

### 1. Database Setup
Ensure PostgreSQL is running and create a database for the project. Update the `.env` file in the `backend/` directory with your database URL:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/orbitflow"
JWT_SECRET="your-super-secret-key"
PORT=3001
```

### 2. Backend Initialization
```bash
cd backend
npm install
npx prisma db push
npm run db:seed  # Seeds the database with the initial Admin account
npm run dev
```

### 3. Frontend Initialization
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 🔐 Default Credentials
If you ran the database seed command, an initial Global Admin account is provided:
- **Email:** admin@orbitflow.dev
- **Password:** `Admin123!`



