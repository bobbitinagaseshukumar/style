# 🛍️ StyleVerse Enterprise MERN E-Commerce Platform

StyleVerse is an enterprise-level, production-ready MERN e-commerce platform built for sarees, kurtis, and jewellery retail. Features **22 dynamic home page sections**, **Super Admin Dashboard**, **Email OTP Authentication**, **Variant Management**, **Redux Shopping Cart**, **Multi-step Express Checkout**, **Automatic Stock Deduction**, **Order Status Tracking Timelines**, **Customer In-App Notifications**, **Dynamic XML Sitemap (`/sitemap.xml`)**, and **Disaster Recovery Database Backups**.

---

## 🚀 Key Features Overview

- **Dynamic Home Page (22 Sections)**: Hero sliders, flash sales, featured collections, brand logos, testimonials.
- **Super Admin Dashboard**: Full zero-code website control, product catalog management, order processing, and settings configuration.
- **Customer Account & Security**: Email OTP verification, dual-mode login, profile manager, and multi-address book.
- **Product Ecosystem**: Variant management (sizes, colors), stock alerts (< 10 pcs), price discount engine, and luxury product detail pages with zoom gallery.
- **Purchasing & Checkout**: Redux cart, coupon discounts (`FESTIVE15`), express checkout, automatic inventory stock deduction, and status timeline tracking (`Confirmed` -> `Packed` -> `Shipped` -> `Delivered`).
- **CMS & Legal Pages**: Editable About Us, Contact Us inbox, FAQ accordions, legal policy pages, and Newsletter CSV exporter.
- **Communication & Payment**: COD, UPI, Cards, Nodemailer HTML emails, customer In-App Notification Center, and broadcast campaign manager.
- **Analytics, SEO & Administration**: Real-time sales charts, CSV sales report exports, SERP Google snippet preview, dynamic `/sitemap.xml`, and database recovery snapshots.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, Vite 5, Redux Toolkit, Tailwind CSS, Framer Motion, Axios.
- **Backend**: Node.js 20, Express.js 4, Prisma ORM 5.
- **Database**: SQLite (Development) / Supabase PostgreSQL (Production).
- **Deployment**: Vercel (Frontend), Render (Backend), GitHub Actions (CI/CD).

---

## ⚡ Quick Start

```bash
# Server Setup
cd server
npm install
npx prisma db push
node seed/seed.js
npm run dev

# Client Setup (In separate terminal)
cd client
npm install
npm run dev
```

- **Backend API**: `http://localhost:5000`
- **Frontend Application**: `http://localhost:3000`
- **Super Admin Credentials**: `admin@styleverse.com` / `Admin@123456`

---

## 📚 Documentation Links
- [System Architecture Specification](file:///c:/Users/harib/Documents/kumar%20projects/KVLR%20styles/docs/ARCHITECTURE.md)
- [Super Admin User Manual](file:///c:/Users/harib/Documents/kumar%20projects/KVLR%20styles/docs/ADMIN_USER_MANUAL.md)
- [Developer Onboarding & Setup Guide](file:///c:/Users/harib/Documents/kumar%20projects/KVLR%20styles/docs/DEVELOPER_GUIDE.md)
