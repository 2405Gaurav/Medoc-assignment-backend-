# **Medoc-Assignment (Backend-Intern)**

> **OPD Token Allocation System with Elastic Capacity Management for Hospital Out-Patient Departments**

Medoc-Assessment is a priority-driven OPD queue and slot management system that enables intelligent token allocation, dynamic waitlist handling, emergency insertion, and delay propagation. Built using **Next.js 14**, **TypeScript**, and **Tailwind CSS**, it simulates real hospital outpatient workflows with realistic operational constraints.

---

## 👤 Author

**Gaurav Thakur**

---

## 📌 Overview

The system manages outpatient department flow through a robust set of capabilities:

- ✅ Priority-based token allocation
- ✅ Strict slot capacity enforcement
- ✅ Automatic waitlist promotion
- ✅ Emergency patient handling
- ✅ Cascading delay adjustments
- ✅ Full OPD day simulation across multiple doctors

---

## ⚙️ Core Features

### 🔢 Token Priority Sources

Priority order — **lowest number = highest priority**:

| Priority | Type |
|----------|------|
| 0 | 🚨 Emergency |
| 1 | 💳 Paid Priority |
| 2 | 📅 Follow-up / Online Booking |
| 3 | 🚶 Walk-in |

---

### 🔒 Slot Capacity Rules

- **Hard slot limits** — prevents overbooking at all times
- When a slot is full → **patient is automatically added to the waitlist**
- Maintains **fair FIFO ordering** within the same priority level

---

### 🔄 Dynamic Reallocation

Triggered when a token is **cancelled** or a patient is marked as a **no-show**:

1. Slot becomes free
2. Highest-priority waitlist patient is selected
3. FIFO applied within the same priority tier
4. **New token is automatically issued** for the freed slot

---

### 🚨 Emergency Insertion

- Emergency patients can **force allocation into a full slot**
- System **bumps the lowest-priority existing token**
- Bumped patient is seamlessly moved to the **waitlist**

---

### ⏱️ Delay Propagation

- A doctor's delay shifts the **current slot timing** forward
- All **subsequent slots auto-adjust** accordingly
- Updated **estimated visit times** are reflected system-wide in real time

---

## 🗺️ Token Allocation Flowchart

```
┌─────────────────┐
│    Allocate     │
│    Request      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Validate     │
│  doctor, slot   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Slot capacity  │
│   available?    │
└───────┬─────────┘
        │
   YES  │  NO
   ▼         ▼
┌──────────────┐   ┌──────────────────┐
│ Allocate     │   │  Add to waitlist │
│ token        │   │  → HTTP 200      │
│ → HTTP 201   │   └──────────────────┘
└──────────────┘
```

---

## 🔁 Reallocation Logic (Cancel / No-Show)

```
Free Slot
    ↓
Select next waitlist patient
(priority ASC → FIFO within same priority)
    ↓
Create new token for freed slot
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 14 (App Router)** | Full-stack framework |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | UI styling |
| **Vitest** | Unit testing |

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open in your browser:

```
http://localhost:3000
```

**Available Modules:**

- 📊 Dashboard
- 🎫 Token Allocation
- 📋 Waitlist
- 🔬 Simulation

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test` | Run unit tests (Vitest) |

---

## 🗂️ Project Structure

```
app/
  ├── dashboard/
  ├── token-allocation/
  ├── waitlist/
  ├── simulation/
  └── api/

lib/
  ├── types/
  ├── store/
  ├── seed/
  ├── allocation-engine/
  └── simulation/
```

---

## 📡 API Summary

### 🎫 Token Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tokens/allocate` | Allocate token or add to waitlist |
| `DELETE` | `/api/tokens/:id/cancel` | Cancel token and trigger reallocation |
| `POST` | `/api/tokens/:id/mark-no-show` | Mark no-show and trigger reallocation |
| `POST` | `/api/tokens/emergency-insert` | Force emergency patient insertion |

### 🩺 Doctors & Slots

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/doctors/:id/slots?date=` | Fetch available slots for a doctor |

### 📋 Waitlist

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/waitlist` | Retrieve all waitlist entries |

### 🔬 Simulation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/simulation/run` | Run a full OPD day simulation |

---

## 📝 Notes

This project is designed as a **real-world OPD flow simulation**, suitable for:

- 🏥 Hospital queue optimization research
- 💼 Healthcare SaaS prototypes
- 🧩 System design demonstrations
- 🧑‍💻 Full-stack engineering portfolios

---

## 📄 License

**MIT License** — free to use, modify, and distribute.
