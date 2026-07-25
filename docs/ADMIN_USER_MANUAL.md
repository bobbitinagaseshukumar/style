# StyleVerse Super Admin User Manual

Welcome to the **StyleVerse Super Admin Dashboard**. This manual covers step-by-step instructions for managing your entire e-commerce store without writing code.

---

## 🔐 1. Admin Login & Credentials

- **Admin URL**: `http://localhost:3000/login`
- **Default Email**: `admin@styleverse.com`
- **Default Password**: `Admin@123456`

---

## 🛒 2. Catalog & Product Management (`/admin/products`)

### Adding a New Product:
1. Navigate to **Products** in the sidebar.
2. Click **Add New Product**.
3. Fill in product name, SKU, price, discount percentage (automatically calculates discount price), category, stock quantity, sizes, and colors.
4. Check **Featured**, **Trending**, or **New Arrival** to publish directly to the Home Page.
5. Click **Save Product**.

---

## 📦 3. Orders & Invoice Management (`/admin/orders`)

1. Navigate to **Orders** to view all customer orders.
2. Filter by status: `CONFIRMED`, `PACKED`, `SHIPPED`, `DELIVERED`, `CANCELLED`.
3. Use the dropdown to update order status (triggers live customer In-App & Email notifications).
4. Click **Print Invoice** to open a customer PDF receipt.

---

## ⚡ 4. Homepage Section Publishing (`/admin/homepage`)

1. Navigate to **Homepage Manager**.
2. Toggle Visibility for any of the 22 dynamic sections (Hero Sliders, Flash Sales, Featured Sarees, Kundan Jewellery, Testimonials).
3. Reorder or update section titles and click **Save Layout**.

---

## 📝 5. CMS & Legal Page Editor (`/admin/cms`)

1. Navigate to **CMS Manager**.
2. Select target page (`about-us`, `contact-us`, `privacy-policy`, `terms-conditions`, `shipping-policy`, `refund-policy`).
3. Update HTML content and click **Save Page Content**.
4. View customer contact form inquiries in the **Customer Inquiries** tab.
5. Click **Export CSV** in the **Newsletter Subscribers** tab to download subscriber lists.

---

## 💾 6. Database Backups & Recovery (`/admin/backup`)

1. Navigate to **Database Backup**.
2. Click **Create Snapshot Now** to generate a database recovery snapshot.
