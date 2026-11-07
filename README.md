# Finora Banking | Professional Digital Banking & Transaction Management System

Finora Banking is a full-stack, enterprise-grade digital banking web application engineered with Node.js, Express.js, MongoDB (Mongoose), React, Vite, and Tailwind CSS. It features double-entry ledger accounting, idempotent payment processing, atomic MongoDB session transactions, and JWT authentication.

---

## 🌟 Key Features

### 1. Security & Authentication
* **JWT Cookie & Authorization Bearer**: Dual support for secure HTTP-only cookies and Authorization Bearer headers.
* **Token Blacklisting**: Logout blacklists tokens in MongoDB to ensure true session invalidation.
* **Privilege Guard**: Middleware enforces system-user privileges for administrative operations (initial funds injection).

### 2. Double-Entry Ledger Engine
* **ACID Transactions**: Financial operations execute inside MongoDB session transactions.
* **Immutable Ledger**: Ledger records strictly maintain CREDIT and DEBIT balanced entries.
* **Calculated Balances**: Available balances aggregate ledger entries in paise and include only entries whose transaction status is `success`; `pending`, `failed`, and `reversed` transactions are excluded.
* **Concurrency-Safe Spending**: Transfers and system-user funding lock the source account in the MongoDB transaction before checking its available balance. System accounts cannot be overdrawn.

### 3. Idempotent Transfers
* **Duplicate Prevention**: A unique database index on transaction idempotency keys prevents concurrent duplicates. Identical retries return the original transaction; reusing a key with different parameters is rejected.

### 4. Professional React UI/UX
* **Fintech Aesthetics**: Dark-mode glassmorphism design with emerald & navy accents, powered by Tailwind CSS v4.
* **Interactive Dashboard**: Welcome hero, real-time balance metrics, Recharts activity visualization, and recent activity.
* **Account Portfolio**: Create checking accounts, copy account IDs, view status badges.
* **Money Transfer**: Validation, source selection, recipient ID verification, confirmation dialog, idempotency reference key, and confetti celebration!
* **Transaction History**: Filter by credit/debit/status, search by Ref/ID, sort by date, pagination.
* **Receipts & Statements**: Interactive printable receipt modal and downloadable official PDF statements via `jspdf` & `jspdf-autotable`.

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v18 or higher
* **MongoDB**: Running locally at `mongodb://127.0.0.1:27017/banktransaction` (or configured via environment variable)
* **Replica set for tests**: The integration suite starts an isolated disposable in-memory MongoDB replica set. On Windows, the MongoDB binary may require the Microsoft Visual C++ Redistributable.

### Installation

1. Install root backend dependencies:
   ```bash
   npm install
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Running the Application

* **Start Backend Server** (Port 3000):
  ```bash
  npm run server
  ```

* **Start Frontend React Client** (Port 5173):
  ```bash
  npm run client
  ```

* **Open App in Browser**:
  Navigate to `http://localhost:5173`

---

## 📡 API Endpoints Reference

### Authentication (`/api/auth`)
* `POST /api/auth/register` — Register a new bank user `{ name, email, password }`
* `POST /api/auth/login` — Sign in `{ email, password }`
* `POST /api/auth/logout` — Logout user & blacklist session token
* `GET /api/auth/me` — Verify session and return logged-in profile

### Account Management (`/api/account`)
* `POST /api/account/` — Create new checking account
* `GET /api/account/` — List logged-in user's accounts
* `GET /api/account/balance/:accountId` — Fetch aggregated balance for account ID

### Transactions (`/api/transaction`)
* `POST /api/transaction/` — Transfer funds between accounts `{ fromAccount, toAccount, amount, idempotencyKey }`
* `GET /api/transaction/` — Retrieve user transaction history
* `GET /api/transaction/system/eligible-accounts` — List active recipient accounts for an authenticated system user
* `POST /api/transaction/system/initial-funds` — Privileged initial funds deposit (System Admin only)

### Funding a local test account

Account creation intentionally starts at ₹0. Balances are calculated from successful persisted ledger entries; ordinary users cannot create funds by changing client state.

1. Sign in as the test user and create an active account from **Accounts**. Copy its account ID.
2. Sign in as an already-authorized system user with an active funding account and enough persisted available balance. The system-user account must already hold at least the amount being funded; this endpoint does not mint or bypass funds.
3. Open **Deposit** as the system user, select the test user's account, enter any positive amount with up to two decimal places, and submit. For example, two deposits of `500.00` and `1000.00` produce a ₹1,500 balance if the account starts at zero. Each distinct deposit uses a new idempotency key. The UI calls `POST /api/transaction/system/initial-funds` with `{ "toAccount": "<test-account-id>", "amount": "500.00", "idempotencyKey": "<unique-key>" }`.
4. Sign back in as the test user. Refresh the Dashboard or query `GET /api/account/balance/<test-account-id>`; it should show ₹10,000 only after the successful funding transaction is committed. Transaction history is loaded from `GET /api/transaction/`.

The funding request is authenticated and restricted to system users. It is idempotent and commits the funding transaction and both ledger entries atomically; insufficient funds, inactive accounts, or duplicate request keys are rejected. Deposits from another Finora user use the normal authenticated `POST /api/transaction/` transfer API.

The current **Withdraw** screen also posts to `POST /api/transaction/` and requires a destination account ID, so it records an outgoing ledger transfer to that account; this project does not currently have a separate external cash-withdrawal API.

The backend verifies/creates the unique transaction idempotency index before it starts listening. If existing duplicate idempotency keys prevent index creation, resolve those records before restarting; the server will not start without the unique constraint.

Run backend financial-integrity tests with `npm test`. They use a disposable in-memory replica set and never use the configured application MongoDB URI.

---

## 🎨 Technology Stack

* **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Recharts, jsPDF, React Hot Toast, Canvas Confetti
* **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT (`jsonwebtoken`), Cookie Parser, Bcrypt.js, Nodemailer
