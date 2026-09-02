# EventSphere - Full-Stack Event Management & Ticketing Platform

**EventSphere** is a production-oriented, full-stack Event Management, Ticketing, Moderation, and Sponsorship platform built with **Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt, EJS, HTML, CSS, and JavaScript**.

---

## 🌟 Overview & Features

EventSphere provides complete end-to-end event lifecycle management across five distinct user roles:

1. **Attendee**:
   - Browse public approved events with title, category, venue, and price filters.
   - Register for events with real-time capacity validation and race-condition safety.
   - View active tickets with unique ticket tracking IDs (`EVT-YYYY-XXXXXX`).
   - Cancel active registrations (atomically freeing event seats).
2. **Organizer**:
   - Create, edit, and manage capacity/prices for events.
   - Automatic `pending` moderation status on event submission.
   - Track ticket sales, total registrations, and event approval statuses.
   - Cancel hosted events.
3. **Moderator**:
   - Queue-based review of pending organizer events.
   - Approve, reject with reason, or request revisions on events.
   - Resolve or dismiss community user flag reports.
4. **Sponsor**:
   - Browse events open for sponsorship.
   - Submit financial sponsorship proposals and customized messages.
   - Track pending, approved, or rejected sponsorship offers.
5. **Superadmin**:
   - Full governance and system analytics dashboard.
   - Search, role update, enable/disable accounts, or delete users.
   - Complete content moderation and deletion capability with self-deletion protection.

---

## 🛠️ Technology Stack

- **Backend Logic**: Node.js, Express.js (MVC Pattern)
- **Database & Object Modeling**: MongoDB, Mongoose
- **Security & Authentication**: JSON Web Tokens (JWT), bcrypt (password hashing), Helmet (HTTP security headers), Express Rate Limiting
- **Session Security**: HTTP-only, SameSite Cookies
- **View Engine**: EJS (Embedded JavaScript Templates) with reusable partials
- **Styling**: Custom CSS3 design system (Glassmorphism, dark theme, responsive grid layouts, FontAwesome 6 icons)

---

## 🚀 Installation & Setup Guide

### 1. Prerequisites
Ensure you have Node.js (v18+) and MongoDB installed on your system.

### 2. Clone / Workspace Setup
Navigate to the project directory:
```bash
cd "EVENT MANAGEMENT"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables (`.env`)
Create a `.env` file in the project root (refer to `.env.example`):
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/eventsphere
JWT_SECRET=eventsphere_super_secret_jwt_key_2026_secure_random
JWT_EXPIRES_IN=1d
NODE_ENV=development
ADMIN_EMAIL=admin@eventsphere.com
ADMIN_PASSWORD=AdminPass123!
```

### 5. Seed Initial Superadmin
Run the administrative seed script to bootstrap initial superadmin credentials:
```bash
npm run seed:admin
```

### 6. Launch Application Server
Start in development mode (with `nodemon` hot reloading):
```bash
npm run dev
```
Or start in production mode:
```bash
npm start
```
The platform will be live at `http://localhost:3000`.

---

## 🔐 Security & Authorization Architecture

- **No Plaintext Passwords**: Passwords are automatically hashed with 10 salt rounds of `bcrypt` prior to database save operations.
- **HTTP-Only Cookies**: JWT tokens are signed server-side and transmitted exclusively via HTTP-only cookies (`res.cookie('token', ...)`). Client-side JavaScript cannot access token storage, mitigating XSS risks.
- **Strict Role Middlewares**: Routes are protected using `auth` (token verification) and `authorizeRoles(...roles)` middleware. Direct URL tampering is rejected with a 403 Forbidden error.
- **Resource Ownership Verification**: Organizers can only edit/delete events they own. Attendees can only view/cancel their own tickets. Superadmins are protected against self-deletion.

---

## 📂 Project Architecture

```text
EventSphere/
├── app.js                      # Express application entry & middleware chain
├── package.json                # Project dependencies & npm scripts
├── .env                        # Local environment credentials
├── config/
│   └── db.js                   # Mongoose MongoDB connection builder
├── models/
│   ├── User.js                 # User schema (roles, bcrypt hooks, methods)
│   ├── Event.js                # Event schema (status lifecycle, capacity)
│   ├── Registration.js         # Unique registration tickets & indexes
│   ├── Sponsorship.js          # Sponsorship offers & statuses
│   └── Report.js               # Community report submissions
├── controllers/
│   ├── authController.js       # Authentication, login, logout, profile
│   ├── eventController.js      # Public & organizer event logic
│   ├── registrationController.js# Registration, capacity check, tickets
│   ├── sponsorshipController.js # Sponsor offers & status management
│   ├── moderationController.js  # Moderation queue & report resolution
│   └── adminController.js      # Superadmin metrics & user management
├── middleware/
│   ├── auth.js                 # JWT cookie verification & session attach
│   ├── authorize.js            # Role-based permission guard
│   ├── validation.js           # Server-side input validation schemas
│   └── errorHandler.js         # Centralized error handler
├── routes/
│   ├── authRoutes.js
│   ├── eventRoutes.js
│   ├── registrationRoutes.js
│   ├── sponsorshipRoutes.js
│   ├── moderationRoutes.js
│   ├── adminRoutes.js
│   └── userRoutes.js
├── views/
│   ├── partials/               # Header, Footer, Navbar, Flash Messages
│   ├── home.ejs
│   ├── login.ejs
│   ├── register.ejs
│   ├── events.ejs
│   ├── event-details.ejs
│   ├── organizer-dashboard.ejs
│   ├── attendee-dashboard.ejs
│   ├── moderator-dashboard.ejs
│   ├── sponsor-dashboard.ejs
│   ├── admin-dashboard.ejs
│   ├── user-management.ejs
│   ├── moderation.ejs
│   ├── my-tickets.ejs
│   └── error.ejs
├── public/
│   ├── css/                    # Custom CSS design system
│   └── js/                     # Interactivity & modal scripts
└── scripts/
    └── seedAdmin.js            # Superadmin bootstrap script
```

---

## 📑 Core API & Route Reference

| Method | Endpoint | Access / Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Homepage with featured events & categories |
| `GET` | `/events` | Public | Search, filter & paginate approved events |
| `GET` | `/events/:id` | Public / Auth | Event details & registration modal |
| `POST` | `/register` | Public | Create account with selected role |
| `POST` | `/login` | Public | Authenticate user & set JWT HTTP-only cookie |
| `POST` | `/logout` | Authenticated | Clear cookie & invalidate session |
| `POST` | `/events/create` | Organizer / Admin | Create new event (status = pending) |
| `POST` | `/events/:id/register` | Attendee / Admin | Register for event ticket |
| `GET` | `/tickets` | Attendee | View active & cancelled tickets |
| `POST` | `/tickets/:id/cancel` | Attendee | Cancel ticket & free capacity |
| `POST` | `/events/:id/sponsor` | Sponsor | Submit sponsorship proposal |
| `POST` | `/moderation/events/:id/approve` | Moderator / Admin | Approve pending event |
| `POST` | `/moderation/events/:id/reject` | Moderator / Admin | Reject pending event with reason |
| `GET` | `/admin/dashboard` | Superadmin | Full platform metrics |
| `GET` | `/admin/users` | Superadmin | Search users, update roles, toggle active status |
