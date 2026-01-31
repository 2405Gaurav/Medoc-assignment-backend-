# MedflowX

**OPD Token Allocation System** — elastic capacity management for hospital out-patient departments. Built with Next.js 14 and TypeScript.

**Author:** Yash Dhiman

---

## Features

- **Token sources** (prioritized): Paid Priority (1) → Follow-up / Online Booking (2) → Walk-in (3); Emergency (0)
- **Hard slot limits** — no overbooking; full slots add to waitlist
- **Dynamic reallocation** — cancel/no-show frees slot; waitlist promoted by priority then FIFO
- **Emergency insertion** — bump lowest-priority token if slot full
- **Delay propagation** — slot delay cascades to later slots and estimated times

---

## Flowchart: Token allocation

```
                    ┌─────────────────┐
                    │  Allocate       │
                    │  Request        │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Validate       │
                    │  doctor, slot   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
              ┌─────│  Slot capacity  │─────┐
              │     │  available?      │     │
              │     └─────────────────┘     │
              │ YES                          │ NO
              ▼                              ▼
     ┌─────────────────┐           ┌─────────────────┐
     │  Allocate token  │           │  Add to         │
     │  → 201           │           │  waitlist       │
     └─────────────────┘           │  → 200          │
                                    └─────────────────┘
```

**Reallocation (cancel / no-show):** Free slot → take next waitlist patient (priority ASC, FIFO) → create token for freed slot.

---

## Tech stack

Next.js 14, TypeScript, Tailwind CSS, Vitest.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Dashboard**, **Allocate Token**, **Waitlist**, and **Simulation**.

| Command         | Description           |
|-----------------|-----------------------|
| `npm run dev`   | Development server    |
| `npm run build` | Production build      |
| `npm run test`  | Unit tests (Vitest)    |

---

## Project structure

- `app/` — pages (dashboard, token-allocation, waitlist, simulation) and API routes
- `lib/` — types, store, seed, allocation-engine (priority, allocator, waitlist, reallocation, emergency, delay), simulation

---

## API (summary)

- `POST /api/tokens/allocate` — allocate or waitlist
- `DELETE /api/tokens/:id/cancel` — cancel and reallocate
- `POST /api/tokens/:id/mark-no-show` — no-show and reallocate
- `POST /api/tokens/emergency-insert` — emergency insert (may bump one)
- `GET /api/doctors/:id/slots?date=` — slots for doctor
- `GET /api/waitlist` — waitlist entries
- `POST /api/simulation/run` — run OPD day simulation (3 doctors)

---

## License

MIT.
