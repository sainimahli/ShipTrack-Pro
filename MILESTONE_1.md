# Milestone 1 — Core Setup and Design

## Delivered scope

ShipTrack Pro provides a React/Vite frontend, Spring Boot REST API, PostgreSQL persistence, JWT authentication, OAuth2 Google sign-in, and a role-based shipment workflow.

## Architecture

```text
React (Vite) → Axios API client → Spring Boot controllers
                                  ├─ Spring Security (JWT / OAuth2 / RBAC)
                                  ├─ Services (auth, shipment, tracking)
                                  └─ Spring Data JPA → PostgreSQL
```

The frontend uses route guards to keep public authentication views separate from the authenticated application shell. The backend owns all authentication, role validation, shipment persistence, and tracking-event history.

## Database design

Core tables and their relationships are defined in `database/`:

- `roles` → `users`: each user has one operational role.
- `users` → `shipments`: a user creates shipments and can optionally be the sender or receiver.
- `shipments` → `addresses`: each shipment has origin and destination addresses.
- `shipments` → `tracking_events`: append-only lifecycle and location history.

## Role access matrix

| Role | Access |
| --- | --- |
| Customer | Create shipments, view own authenticated workspace, track shipments |
| Business Client | Create and track business shipments |
| Logistics Operator | Create shipments and update status/location checkpoints |
| Administrator | Manage users, shipments, and delivery operations |

The server enforces these rules for admin, shipment-write, status-update, and location-update endpoints.

## Primary workflows

1. Register → account is validated/approved → sign in with JWT or Google OAuth2.
2. Create shipment → system assigns a tracking number and records the `CREATED` event.
3. Operator updates status/location → tracking history is appended; customers use the tracking dashboard to view progress.
4. Administrator reviews registrations and manages shipment records.

## UI plan implemented

```text
Login/Register → Dashboard → Create Shipment / Manage Shipments / Track Shipment
                                  └→ Profile and role-specific controls
```

The dashboard provides operational metrics and a shipment list; the tracking view provides route, package, ETA, progress, and ordered event history. Mobile styles collapse dashboard cards and tables into accessible scrolling/single-column layouts.

## Run locally

1. Start PostgreSQL and create the `shiptrack` database (this environment uses port `5433`; configure `DB_PORT` if yours differs).
2. Configure the credentials in `backend/.env`.
3. Run `backend\\mvnw.cmd spring-boot:run`.
4. Run `frontend\\npm.cmd run dev` and open the Vite URL.
