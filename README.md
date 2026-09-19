# rocoware

A modern, production-grade **Sanitary Ware Complaint Management Portal** built on the **MERN Stack** (MongoDB, Express.js, React, Node.js).

## 🚀 Features

- **Two-Stage Complaint Lifecycle**:
  - **Stage 1: Register New Complaint**: Records customer and product information along with sanitary ware product type and issue details.
  - **Stage 2: Complete Complaint**: Allocates service technician, records service person details, attended date, bill amount, and remarks upon completion.
- **Sanitary Ware Product Catalog**: Dropdown with 22 sanitary ware product types (Closet, Wall Hung Closet, One Piece Closet, Wash Basin, Counter Top Wash Basin, Urinal, Bidet, Bathtub, etc.) with dynamic "Other Product Name" support.
- **Authoritative Backend Timestamps**: Immutable `registeredAt` and automatic `completedAt` timestamps.
- **Executive PDF Export**: High-resolution PDF reports for completed complaints powered by PDFKit.
- **Authentication & Security**: JWT authentication with HTTP-only cookies, password hashing with bcrypt, rate limiting, and Helmet HTTP headers.
- **Responsive Modern UI**: Built with React, Vite, Tailwind CSS, Lucide icons, and Sonner notifications.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, React Router DOM, Axios, Lucide React, Sonner
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, Multer, PDFKit
- **Database**: MongoDB

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (running locally on port 27017 or MongoDB Atlas URI)

### 2. Backend Setup
```bash
cd backend
npm install
# Configure .env file based on .env.example
npm run dev
```

Default backend runs on `http://localhost:5002`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Default frontend runs on `http://localhost:5173`.

### 4. Default Admin Login
- **Email**: `admin@complaintportal.com`
- **Password**: `Complaint@123`

---

## 📄 License
ISC
