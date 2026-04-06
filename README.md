# Invoice System - GST-Compliant Invoicing for India

A modern, production-ready invoicing web application built for freelancers, consultants, and service-based businesses in India. Features GST-compliant invoices, payment tracking, PDF generation, and WhatsApp sharing.

## 🌐 Live Demo

[Deploy on Cloudflare Pages](#deployment)

## ✨ Features

### Core Features
- **Client Management** - Add, edit, delete clients with GST details
- **GST-Compliant Invoices** - Auto-calculates CGST+SGST or IGST based on client state
- **Payment Tracking** - Mark invoices as Paid, Partial, or Unpaid
- **PDF Export** - Professional invoice PDFs with jsPDF
- **WhatsApp Sharing** - Share invoices directly via WhatsApp
- **Dashboard Analytics** - Revenue, pending payments, recent invoices

### Technical Features
- Cloudflare Workers backend (serverless)
- Cloudflare D1 database (SQLite)
- Vanilla JavaScript (no frameworks)
- Responsive design with dark mode
- REST API architecture

## 📁 Project Structure

```
invoice-system/
├── frontend/
│   ├── index.html          # Login page
│   ├── dashboard.html      # Main dashboard
│   ├── create-invoice.html # Create new invoice
│   ├── clients.html        # Client management
│   ├── payments.html       # Payment tracking
│   ├── css/
│   │   └── styles.css      # Main stylesheet
│   └── js/
│       ├── api.js          # API client
│       ├── pdf.js          # PDF generation
│       ├── utils.js        # Utility functions
│       └── app.js          # Main application logic
├── backend/
│   ├── worker.js           # Cloudflare Worker API
│   ├── db/
│   │   ├── schema.sql      # Database schema
│   │   └── seed.sql        # Sample data
│   └── wrangler.toml       # Worker configuration
├── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Cloudflare account (free tier works)
- Wrangler CLI installed (`npm install -g wrangler`)

### 1. Clone & Install

```bash
cd invoice-system
npm install
```

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

### 3. Create D1 Database

```bash
wrangler d1 create invoice-system-db
```

Copy the `database_id` from the output.

### 4. Update wrangler.toml

Edit `backend/wrangler.toml` and replace:
- `database_id` with your D1 database ID
- `JWT_SECRET` with a secure random string
- `FRONTEND_URL` with your Pages URL (after deployment)

### 5. Initialize Database

```bash
npm run db:init
npm run db:seed  # Optional: adds sample data
```

### 6. Run Locally

```bash
npm run dev
```

Visit `http://localhost:8787`

## 📦 Deployment

### Deploy Backend (Worker)

```bash
npm run deploy
```

### Deploy Frontend (Pages)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** → **Create Project**
3. Connect your GitHub repository
4. Set build command: (leave empty - no build step)
5. Set build output directory: `frontend`
6. Add environment variable: `API_URL` = your Worker URL

## 🔐 Default Login

After running seed data:
- **Email:** admin@example.com
- **Password:** admin123

## 📊 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Login with email/password |

### Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients` | Get all clients |
| POST | `/api/clients` | Create client |
| PUT | `/api/clients/:id` | Update client |
| DELETE | `/api/clients/:id` | Delete client |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | Get all invoices |
| POST | `/api/invoices` | Create invoice |
| GET | `/api/invoices/:id` | Get invoice details |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments` | Record payment |
| GET | `/api/payments/:invoiceId` | Get invoice payments |

## 🇮🇳 GST Logic

The system automatically applies correct GST:
- **Intra-state** (same state): CGST + SGST (half each)
- **Inter-state** (different state): IGST (full amount)

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| PDF | jsPDF |
| Hosting | Cloudflare Pages + Workers |

## 📝 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Support

For issues or questions, please open an issue on GitHub.
