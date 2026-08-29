# HealthCare+

> **One Healthcare Ecosystem. Every Care Journey. Connected.**  
> *From discovery to diagnosis. From lab reports to medicines. From routine care to emergency response.*

[![Smart India Hackathon](https://img.shields.io/badge/SIH-orange.svg)](#23-team--project-credits)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2-purple.svg)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-336791.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748.svg)](https://www.prisma.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-black.svg)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC.svg)](https://tailwindcss.com/)

---

## 📑 Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [Problem Statement & Market Gap](#2-problem-statement--market-gap)
3. [The HealthCare+ Solution](#3-the-healthcare-solution)
4. [Hero Innovations](#4-hero-innovations)
5. [User Roles & Access Matrix](#5-user-roles--access-matrix)
6. [System Architecture](#6-system-architecture)
7. [End-to-End Application Workflows](#7-end-to-end-application-workflows)
8. [Technology Stack](#8-technology-stack)
9. [Project Repository Structure](#9-project-repository-structure)
10. [Authentication, Authorization & Security](#10-authentication-authorization--security)
11. [Database Architecture & Data Model](#11-database-architecture--data-model)
12. [API Architecture & Endpoint Reference](#12-api-architecture--endpoint-reference)
13. [Major Functional Modules](#13-major-functional-modules)
14. [External Integrations](#14-external-integrations)
15. [Environment Variables Configuration](#15-environment-variables-configuration)
16. [Installation & Setup Guide](#16-installation--setup-guide)
17. [Seeded Demo Environment & Pilot Network](#17-seeded-demo-environment--pilot-network)
18. [Testing & Quality Assurance](#18-testing--quality-assurance)
19. [Current Implementation Status](#19-current-implementation-status)
20. [Future Roadmap (Specification vs Codebase)](#20-future-roadmap-specification-vs-codebase)
21. [Troubleshooting Guide](#21-troubleshooting-guide)
22. [Contributing Guidelines](#22-contributing-guidelines)
23. [Team & Project Credits](#23-team--project-credits)

---

## 1. Executive Overview

**HealthCare+** is a full-stack, multi-tenant digital healthcare operating system built for connected city-wide healthcare delivery. Created for **Smart India Hackathon (Build with Bharat 2.0)** under the *Open Innovation* track by **Team CodeFlow**, HealthCare+ unifies patients, hospitals, doctors, pharmacies, diagnostic laboratories, and emergency ambulance networks into one continuous, real-time ecosystem.

Rather than acting as a disjointed booking portal or an isolated hospital management software (HMS), HealthCare+ functions as the **orchestration layer** for physical healthcare. Independent hospitals operate with tenant-level operational isolation while patients experience a unified digital journey: from initial AI symptom triage and appointment scheduling to live OPD queue tracking, digital consultations, pharmacy fulfillment, diagnostic lab reporting, unified billing, and SOS ambulance dispatch with live GPS navigation.

The platform is deployed and seeded with a live pilot network in **Vadodara, Gujarat**, featuring 8 real hospital locations, 28 doctors across 12 specialties, active emergency ambulances, pharmacy inventory, lab catalogs, and automated daily demo-schedule rolling.

---

## 2. Problem Statement & Market Gap

### The Real Problem: Digitally Fragmented Healthcare

Healthcare is deeply connected clinically, but digitally fragmented. In the current Indian healthcare ecosystem:
- **The Patient is Forced to Become the Integration Layer:** A patient visiting a hospital must manually carry physical paper files between reception desks, doctor chambers, billing counters, diagnostic laboratories, and external pharmacies.
- **Overcrowded OPD Waiting Rooms:** Patients wait for hours in physical OPD waiting areas with zero visibility into doctor delays or their actual token position.
- **Siloed Medical Records:** Medical history is locked inside separate hospital systems or lost on paper prescriptions, preventing continuity of care during emergencies or multi-hospital treatments.
- **Disconnected Emergency Logistics:** Emergency response relies on blind phone calls without real-time GPS tracking, nearest-driver dispatch, or automated hospital triage prep.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        TODAY'S FRAGMENTED REALITY                       │
│                                                                         │
│  [Google Search] ──> [Hospital Website] ──> [Manual Phone Call]        │
│          │                                          │                   │
│  [Physical Queue] <── [Paper File / Token] <────────┘                   │
│          │                                                              │
│  [Doctor Visit] ──> [Paper Prescription] ──> [Separate Pharmacy Line]  │
│          │                                                              │
│  [Separate Lab Center] ──> [Paper Test Reports] ──> [Repeat OPD Queue]  │
│                                                                         │
│         ❌ NO UNIFIED HISTORY  •  ❌ PASSTHROUGH FRICTION               │
└─────────────────────────────────────────────────────────────────────────┘
```

### Market Gap Analysis

| Capability | Consumer Aggregators<br>*(Practo, Apollo 24/7, Halodoc)* | Enterprise HMS<br>*(Epic, Cerner, Custom HMS)* | Emergency Networks<br>*(RED.Health)* | **HealthCare+** |
|---|:---:|:---:|:---:|:---:|
| **Hospital Discovery & Booking** | ✅ Strong | ❌ None | ❌ None | ✅ **Native** |
| **Multi-Hospital Network** | ❌ Aggregated Only | ❌ Isolated Per Tenant | ❌ None | ✅ **Multi-Tenant Network** |
| **Real-Time Live OPD Queue** | ⚠️ Partial / Static | ⚠️ Internal Only | ❌ None | ✅ **WebSocket Live Sync** |
| **Fractional "Lite" Queue Tokens** | ❌ None | ❌ None | ❌ None | ✅ **Native (e.g. #15.5)** |
| **Connected Lab + Pharmacy Chain** | ⚠️ Fragmented | ✅ Internal | ❌ None | ✅ **Closed-Loop Workflow** |
| **Unified Single Bill (All Services)**| ⚠️ Partial | ✅ Internal | ❌ None | ✅ **Consolidated Razorpay** |
| **Live GPS Ambulance SOS Dispatch** | ❌ None | ❌ None | ✅ Focused | ✅ **Built-In City Dispatch** |
| **Longitudinal Healthcare Passport** | ⚠️ Siloed | ✅ Single-System | ❌ None | ✅ **Cross-Hospital Consent** |
| **End-to-End Orchestrated Journey** | ❌ Fragmented | ❌ Hospital-Centric | ❌ Emergency-Only | ✅ **Unified Ecosystem** |

---

## 3. The HealthCare+ Solution

HealthCare+ resolves this fragmentation by establishing a unified operating layer connecting six major pillars:

```mermaid
graph TD
    subgraph "HealthCare+ Unified Ecosystem"
        P((PATIENT))
        H[Hospital Management]
        D[Doctor Clinical Suite]
        L[Diagnostic Labs]
        Ph[Pharmacy Fulfillment]
        A[Emergency Ambulance]
        B[Unified Billing]
        HP[Healthcare Passport]
        TC[Telemedicine WebRTC]
    end

    P <--> H
    P <--> D
    P <--> L
    P <--> Ph
    P <--> A
    P <--> B
    P <--> HP
    P <--> TC
```

1. **One Continuous Care Journey:** Every clinical event automatically initiates and informs the next (e.g., Doctor orders lab tests → Lab fulfillment processes request → Report PDF uploaded → Doctor & Patient notified → Report auto-appends to patient's Medical Timeline → Follow-up scheduled).
2. **Multi-Tenant Hospital Federation:** Independent hospitals manage their own departments, doctors, pharmacy inventory, lab catalogs, and staff with complete data isolation, while participating in the broader city healthcare network.
3. **Radical Transparency:** Eliminates "black-box" healthcare waiting. Patients monitor real-time queue tokens, pharmacy dispensing states, laboratory diagnostic stages, and incoming ambulance GPS pins.

---

## 4. Hero Innovations

### 1. ⚡ Fractional Queue Intelligence ("Lite Appointments")
*Problem:* Patients needing quick 2-minute follow-ups, post-treatment checks, or lab report reviews are forced to wait through standard 15–30 minute OPD consultation queues.  
*Innovation:* HealthCare+ introduces **fractional queue tokens** (e.g., Token `15.5` slotted between regular Tokens `14`, `15`, and `16`). Doctors who configure `acceptsLiteAppointments: true` can offer low-cost, short-duration slots that dynamically insert into the active queue without disrupting booked sequential slots.

### 2. 🔍 Radical Multi-Workflow Transparency
Every operational process is modelled as an observable state machine updated via WebSockets:
- **OPD Queue:** `WAITING` $\rightarrow$ `CALLED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED` *(or `SKIPPED`)*
- **Laboratory:** `PENDING` $\rightarrow$ `CONFIRMED (PAID)` $\rightarrow$ `SAMPLE_COLLECTED` $\rightarrow$ `PROCESSING` $\rightarrow$ `COMPLETED`
- **Pharmacy:** `PENDING` $\rightarrow$ `CONFIRMED (PAID)` $\rightarrow$ `PREPARING` $\rightarrow$ `PACKED` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED`
- **Emergency SOS:** `REQUESTED` $\rightarrow$ `SEARCHING` $\rightarrow$ `DRIVER_ASSIGNED` $\rightarrow$ `EN_ROUTE` $\rightarrow$ `PICKED_UP` $\rightarrow$ `ARRIVED`

### 3. 🌐 Longitudinal Healthcare Passport with Granular Consent
Patients maintain complete sovereignty over their medical history across all network hospitals.
- Tracks chronic conditions, drug allergies, active medications, and full medical timelines.
- **Granular Consent Mechanism:** Doctors can only access a patient's historical records if the patient has granted active, non-revoked `PassportConsent`. If consent is absent, the clinical consultation proceeds with sensitive history restricted and cross-hospital consultation notes hidden.

### 4. 🚑 City-Wide Nearest-Ambulance Dispatch with 108 Fallback
- **Cross-Hospital Emergency Exception:** While hospital data is strictly isolated, emergency SOS dispatch searches across **all online ambulances in the city network** using a geospatial Haversine radius calculation to find the closest vehicle.
- **Atomic Acceptance:** Prevents double-booking via atomic database lock (`WHERE status = 'SEARCHING'`).
- **Live GPS Navigation:** Streams driver coordinates directly to the patient's interactive Google Maps interface with dynamic distance/ETA calculation.
- **3-Minute Safety Fallback:** If no ambulance driver accepts within 180 seconds, the system automatically transitions to `NO_DRIVER_FALLBACK` and directs the patient to dial India's national **108 Emergency Helpline**.

---

## 5. User Roles & Access Matrix

HealthCare+ implements Role-Based Access Control (RBAC) backed by PostgreSQL database enums and enforced across both backend middleware and frontend route guards.

| Role | Target Actor | Primary Dashboard & Capabilities | Guarded Boundaries |
|---|---|---|---|
| `PATIENT` | Individuals & families seeking care | `/patient/dashboard`<br>• Search hospitals & book appointments (Regular / Lite)<br>• Live OPD queue tracker with estimated wait times<br>• Access Healthcare Passport, Medical Timeline & Consent Manager<br>• 1-Tap SOS Emergency Dispatch with real-time GPS tracking<br>• View prescriptions, track pharmacy orders, view lab reports<br>• Unified bill payment via Razorpay<br>• Online Telemedicine Video Consultations | Cannot access staff dashboards or other patients' records/bills. |
| `DOCTOR` | Practicing clinical physicians | `/doctor/dashboard`, `/doctor/queue`<br>• Live daily OPD queue management (Call Next, Start, Skip, Complete)<br>• Clinical Consultation Suite: symptoms, diagnosis, treatment plans (with autosave)<br>• Digital Prescriptions with dosage & duration<br>• Diagnostic Lab test ordering with priority flags<br>• Patient profile review (gated by Passport Consent)<br>• WebRTC Telemedicine video consultation suite | Scoped to assigned hospital and department. Cannot modify billing or administrative settings. |
| `HOSPITAL_ADMIN` | Hospital administrators | `/admin/dashboard`<br>• Real-time hospital analytics (Revenue, OPD volume, emergency load)<br>• Department and Doctor roster management<br>• Staff invitation & lifecycle management (Pharmacists, Lab Staff, Drivers)<br>• Hospital-wide queue monitor with emergency override/force-skip<br>• Pharmacy medicine stock inventory management<br>• Diagnostic lab test catalog & pricing configuration<br>• Comprehensive immutable Audit Log viewer | Scoped strictly to own hospital (`req.hospitalId`). Cannot access peer hospital records. |
| `RECEPTIONIST` | Front-desk hospital staff | `/admin/dashboard` *(Receptionist View)*<br>• Patient check-in and queue token issuance<br>• Appointment verification and schedule overview<br>• Hospital queue status monitoring | Scoped to own hospital. No access to clinical notes or system configuration. |
| `PHARMACIST` | Hospital pharmacy operators | `/pharmacy/dashboard`<br>• Incoming prescription order fulfillment queue<br>• State transitions: `PREPARING` $\rightarrow$ `PACKED` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED`<br>• Medicine inventory stock management (pricing, units, generic names)<br>• Invoice & payment verification | Scoped to own hospital pharmacy orders and stock. |
| `LAB_STAFF` | Diagnostic pathology technicians | `/lab/dashboard`<br>• Diagnostic test order fulfillment queue<br>• Status workflow: `SAMPLE_COLLECTED` $\rightarrow$ `PROCESSING` $\rightarrow$ `COMPLETED`<br>• Lab report document upload (PDF) with clinical result summaries<br>• Master test catalog association and test management | Scoped to own hospital lab requests and diagnostic catalog. |
| `AMBULANCE_DRIVER` | Paramedics & ambulance operators | `/driver/dashboard`<br>• Online / Offline availability toggle<br>• Real-time GPS location broadcasting (`watchPosition`)<br>• Incoming SOS dispatch popups with audible alert & 1-tap accept/reject<br>• Ride status tracker: `EN_ROUTE` $\rightarrow$ `PICKED_UP` $\rightarrow$ `ARRIVED`<br>• Persistent state rehydration on page reload via `GET /driver/me` | Cannot access general hospital records or unauthorized patient data. |
| `SUPER_ADMIN` | Platform network operators | `/superadmin/dashboard`<br>• City-wide multi-hospital network management (Create, Update, Deactivate)<br>• Global user management across all 8 roles<br>• Network-level analytics and cross-hospital system monitoring | Global platform access across all hospitals. |

---

## 6. System Architecture

HealthCare+ is engineered with a layered, decoupled architecture separating presentation, RESTful business services, persistent relational storage, and an authoritative real-time WebSocket layer.

```mermaid
flowchart TD
    subgraph Clients ["Presentation Layer (Vite + React 19 SPA)"]
        Web[Web Browser - Desktop / Tablet]
        Mobile[Mobile Browser / PWA via HTTPS Tunnel]
    end

    subgraph Gateway ["Networking & Security"]
        Nginx["Reverse Proxy / Cloudflare Tunnel"]
        CORS["CORS Allowlist + Helmet Headers"]
        RateLimit["Express Rate Limiting (Auth & OTP)"]
    end

    subgraph Backend ["Application Layer (Node.js + Express)"]
        AuthMiddleware["JWT Authentication + Silent Refresh"]
        RBACMiddleware["RBAC (checkRole) + Hospital Scoping (scopeToHospital)"]
        Validation["Zod Request Validation"]
        
        subgraph Services ["Core Business Logic Services"]
            ApptService["Appointments & Slots Service"]
            QueueService["Atomic Queue & Lite Token Service"]
            ClinicalService["Consultations & Prescriptions Service"]
            BillingService["Unified Billing & Razorpay Service"]
            LabService["Lab Fulfillment Service"]
            PharmacyService["Pharmacy Orders Service"]
            EmergencyService["Emergency Haversine Dispatch Service"]
            PassportService["Passport & Consent Service"]
            AIService["AI Symptom Triage Engine"]
        end
    end

    subgraph RealTime ["Real-Time Layer (Socket.IO)"]
        SocketServer["Socket.IO Server (Handshake JWT Auth)"]
        Rooms["Rooms: user:{id}, doctor:{id}:{date}, hospital:{id}:queue, emergency:{id}, consultation:{id}"]
        WebRTCRelay["WebRTC Video Signaling Relay"]
    end

    subgraph Data ["Data Persistence Layer"]
        Prisma["Prisma ORM (5.22.0)"]
        Postgres[("PostgreSQL 14+ Database")]
        LocalStorage["Local File Storage (backend/uploads/ - Lab PDFs)"]
    end

    subgraph External ["External Third-Party APIs"]
        RazorpayAPI["Razorpay Payment Gateway"]
        GoogleMapsAPI["Google Maps JavaScript & Directions API"]
        GoogleOAuthAPI["Google OAuth 2.0 Token Verification"]
        SMTPServer["Nodemailer (Gmail / SMTP / Resend)"]
    end

    Clients --> Gateway
    Gateway --> AuthMiddleware
    AuthMiddleware --> RBACMiddleware --> Validation --> Services
    
    Services --> Prisma --> Postgres
    Services --> LocalStorage
    Services -.->|"Trigger Event"| SocketServer
    
    Clients <-->|"Bidirectional WebSocket"| SocketServer
    SocketServer --> Rooms
    SocketServer --> WebRTCRelay
    
    BillingService <--> RazorpayAPI
    EmergencyService <--> GoogleMapsAPI
    AuthMiddleware <--> GoogleOAuthAPI
    Services --> SMTPServer
```

### Layered Backend Request Cycle

```mermaid
flowchart LR
    Req[HTTP Request] --> Router["Express Router<br/>(routes/*.js)"]
    Router --> Auth["authenticate<br/>(JWT Verify)"]
    Auth --> Role["checkRole<br/>(RBAC)"]
    Role --> Scope["scopeToHospital<br/>(Tenant Isolation)"]
    Scope --> Val["validate<br/>(Zod Schema)"]
    Val --> Ctrl["Controller<br/>(controllers/*.js)"]
    Ctrl --> Svc["Service<br/>(services/*.js)"]
    Svc --> Prisma["Prisma Client"]
    Prisma --> DB[("PostgreSQL")]
    Svc -.->|"Optional Socket Emit"| Socket["Socket.IO Room"]
    Ctrl --> Res["Response: { success: true, data }"]
```

---

## 7. End-to-End Application Workflows

### 7.1 Appointment Booking $\rightarrow$ Unified Billing $\rightarrow$ Queue Token Issuance

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    participant Frontend
    participant API as Express API
    participant Razorpay
    participant DB as PostgreSQL
    participant Socket as Socket.IO

    Patient->>Frontend: Select Doctor, Date & Time Slot
    Frontend->>API: POST /api/appointments/initiate
    API->>DB: Create Appointment (status: PENDING_PAYMENT)
    API->>DB: Create Bill (status: UNPAID) + BillItems
    API->>Razorpay: Create Razorpay Order
    API-->>Frontend: Return { appointmentId, billId, razorpayOrderId, keyId }
    
    Frontend->>Patient: Open Razorpay Checkout Modal
    Patient->>Razorpay: Complete Payment (UPI / Card / NetBanking)
    Razorpay-->>Frontend: Return { razorpayPaymentId, razorpaySignature }
    
    Frontend->>API: POST /api/billing/pay (Signature Verification)
    API->>DB: Verify Signature & Update Payment (SUCCESS)
    API->>DB: Update Bill (status: PAID)
    API->>API: Trigger onBillPaid('APPOINTMENT')
    API->>DB: Update Appointment (status: CONFIRMED)
    API->>DB: Generate QueueToken (Recalculate Sequential Ordering)
    API->>DB: Log MedicalTimelineEvent (APPOINTMENT)
    API->>Socket: Emit queue:updated to doctor:{doctorId}:{date}
    API->>Socket: Emit notification:new to user:{patientId}
    API-->>Frontend: Return { success: true, confirmed: true, tokenNumber }
    Frontend-->>Patient: Display Booking Confirmation & Live Queue Link
```

### 7.2 Clinical Consultation $\rightarrow$ Digital Prescription $\rightarrow$ Pharmacy Order

```mermaid
sequenceDiagram
    autonumber
    actor Doctor
    actor Patient
    participant API as Express API
    participant DB as PostgreSQL
    participant Socket as Socket.IO
    actor Pharmacist

    Doctor->>API: POST /api/queue/call-next
    API->>Socket: Emit queue:token-called to patient room
    Doctor->>API: POST /api/consultations/start
    API->>DB: Create Consultation (status: IN_PROGRESS)
    
    Doctor->>API: POST /api/prescriptions (Medicines, Dosages, Instructions)
    API->>DB: Create Prescription + PrescriptionItems
    API->>DB: Auto-create PharmacyOrder (status: PENDING)
    API->>DB: Create Bill (sourceType: PHARMACY_ORDER)
    
    Doctor->>API: POST /api/consultations/:id/complete
    API->>DB: Update Consultation (COMPLETED) & QueueToken (COMPLETED)
    API->>Socket: Emit notification:new (PRESCRIPTION_CREATED) to Patient
    
    Patient->>API: POST /api/billing/pay (Pay Pharmacy Bill)
    API->>DB: Mark Bill PAID & PharmacyOrder (CONFIRMED)
    API->>Socket: Notify Pharmacy Dashboard
    
    Pharmacist->>API: PUT /api/pharmacy-orders/:id/status (PREPARING -> PACKED -> READY)
    API->>Socket: Emit order status updates to Patient
    Pharmacist->>API: PUT /api/pharmacy-orders/:id/status (COMPLETED)
    API->>DB: Auto-activate Patient MedicineReminder logs
```

### 7.3 Emergency SOS $\rightarrow$ Nearest Haversine Dispatch $\rightarrow$ Live GPS Navigation

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    participant Frontend
    participant API as Express API
    participant DB as PostgreSQL
    participant Socket as Socket.IO
    actor Driver

    Patient->>Frontend: Press & Hold SOS Button (3 Seconds)
    Frontend->>API: POST /api/emergency { latitude, longitude }
    API->>DB: Create EmergencyRequest (status: REQUESTED)
    API->>API: Calculate Haversine distance to all Online Ambulances
    API->>DB: Update EmergencyRequest (status: SEARCHING)
    API->>Socket: Emit emergency:new-request to top 5 closest driver:{userId} rooms
    
    Driver->>Frontend: Receive Incoming SOS Alert with Sound & Modal
    Driver->>API: POST /api/driver/accept/:id
    API->>DB: Atomic Update (WHERE status = 'SEARCHING' -> DRIVER_ASSIGNED)
    API->>Socket: Emit emergency:accepted to emergency:{requestId} room
    
    loop Live GPS Streaming
        Driver->>API: POST /api/driver/location { latitude, longitude }
        API->>Socket: Emit emergency:location-update to Patient Map
    end

    Driver->>API: POST /api/driver/en-route/:id (Status: EN_ROUTE)
    Driver->>API: POST /api/driver/picked-up/:id (Status: PICKED_UP)
    Driver->>API: POST /api/driver/arrived/:id (Status: ARRIVED)
    API->>DB: Timestamp arrivedAt & complete dispatch cycle
```

---

## 8. Technology Stack

### Frontend Architecture

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | [React](https://react.dev/) | `19.2.8` | Modern declarative UI component hierarchy |
| **Build Tool** | [Vite](https://vitejs.dev/) | `8.2.0` | Ultra-fast HMR and optimized production bundling |
| **Routing** | [React Router DOM](https://reactrouter.com/) | `7.18.2` | Client-side routing with guarded layout wrappers |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `4.3.3` | Utility-first responsive CSS styling system |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) | `5.0.14` | Global state with `localStorage` persistence |
| **HTTP Client** | [Axios](https://axios-http.com/) | `1.19.0` | Interceptor-driven HTTP client with silent token refresh |
| **Real-Time Client** | [Socket.IO Client](https://socket.io/) | `4.8.3` | WebSocket client with automatic room rejoin intent tracking |
| **Maps Integration** | [@googlemaps/js-api-loader](https://www.npmjs.com/package/@googlemaps/js-api-loader) | `1.16.8` | Dynamic Google Maps rendering & marker positioning |
| **Authentication UI** | [@react-oauth/google](https://www.npmjs.com/package/@react-oauth/google) | `0.13.5` | Google Identity Services OAuth button & token wrapper |
| **Iconography** | [Lucide React](https://lucide.dev/) | `1.30.0` | Comprehensive lightweight SVG iconography |
| **Code Quality** | [oxlint](https://oxc.rs/) | `1.75.0` | High-performance JavaScript/React linter |

### Backend Architecture

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime** | [Node.js](https://nodejs.org/) | `≥18.0.0` (ESM) | Asynchronous event-driven JavaScript server runtime |
| **Framework** | [Express](https://expressjs.com/) | `4.21.1` | RESTful API middleware routing engine |
| **ORM** | [Prisma ORM](https://www.prisma.io/) | `5.22.0` | Type-safe query builder, schema modeling & migrations |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | `14+` | ACID-compliant relational data storage |
| **Real-Time Engine** | [Socket.IO](https://socket.io/) | `4.8.1` | WebSocket server supporting room-based push updates |
| **Authentication** | [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | `9.0.3` | Dual-token (Access/Refresh) JWT issuance and verification |
| **Password Hashing** | [bcryptjs](https://www.npmjs.com/package/bcryptjs) | `3.0.3` | One-way cryptographic salt-and-hashing (12 rounds) |
| **Google Auth** | [google-auth-library](https://github.com/googleapis/google-auth-library-nodejs) | `11.0.0` | Google OAuth2 ID token verification with audience check |
| **Validation** | [Zod](https://zod.dev/) | `4.4.3` | Strict runtime schema parsing and request body sanitization |
| **Email Delivery** | [Nodemailer](https://nodemailer.com/) | `9.0.5` | SMTP email transport for OTPs, invites, and notifications |
| **Security Headers** | [Helmet](https://helmetjs.github.io/) | `8.0.0` | Secure HTTP response header hardening |
| **Rate Limiting** | [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) | `8.6.2` | IP-based request throttling against brute-force attacks |
| **File Handling** | [Multer](https://github.com/expressjs/multer) | `2.2.0` | Multipart request handling for diagnostic PDF uploads |
| **Dev Tooling** | [Nodemon](https://nodemon.io/) | `3.1.7` | Development auto-reload watcher |
| **Testing** | [Jest](https://jestjs.io/) / [Supertest](https://github.com/ladjs/supertest) | `30.4.2` / `7.2.2` | Unit testing and HTTP integration assertions |

---

## 9. Project Repository Structure

```
HealthCare+/
├── README.md                               # Project documentation & reference
└── healthcare-plus/
    ├── package.json                        # Root helper scripts (dev:tunnel)
    ├── CREDENTIALS.md                      # Seeded demo credentials for all roles
    │
    ├── backend/                            # Node.js + Express + Prisma REST API
    │   ├── package.json
    │   ├── .env.example                    # Backend environment template
    │   ├── prisma/
    │   │   ├── schema.prisma               # Prisma data schema (1,127 lines, 34+ models)
    │   │   ├── seed.js                     # Comprehensive Vadodara demo network seeder
    │   │   ├── seedLabTests.js             # Master lab catalog & test seeder
    │   │   └── migrations/                 # PostgreSQL migration history
    │   ├── uploads/                        # Local file storage for diagnostic lab PDFs
    │   ├── scripts/
    │   │   ├── seedDemoData.js             # Standalone demo data seeder
    │   │   └── checkData.js                # Database verification utility
    │   └── src/
    │       ├── server.js                   # HTTP server boot & Socket.IO initialization
    │       ├── app.js                      # Express configuration & middleware pipeline
    │       ├── config/                     # Environment validation (env.js), CORS (cors.js)
    │       ├── routes/                     # 34 modular route definitions
    │       ├── controllers/                # 27 request-response controller handlers
    │       ├── services/                   # 35 core business logic service classes
    │       ├── middleware/                 # Auth, RBAC, Hospital Scoping, Validation, Error
    │       ├── sockets/                    # Socket.IO handlers & WebRTC signaling relay
    │       ├── templates/                  # HTML email templates (verifyEmail, resetPassword)
    │       ├── utils/                      # ApiError, tokenGenerator, geo, jwt, hash
    │       └── __tests__/                  # 11 Jest test suites
    │
    ├── frontend/                           # React 19 + Vite + Tailwind CSS SPA
    │   ├── package.json
    │   ├── vite.config.js                  # Vite bundler configuration & local proxies
    │   ├── tailwind.config.js              # Tailwind CSS styling tokens
    │   ├── .env.example                    # Frontend environment template
    │   └── src/
    │       ├── main.jsx                    # React root entry point
    │       ├── App.jsx                     # Application wrapper (Google OAuth, Router)
    │       ├── router/
    │       │   └── AppRouter.jsx           # Complete role-guarded route tree
    │       ├── layouts/
    │       │   ├── PublicLayout.jsx        # Landing & public layout wrapper
    │       │   └── DashboardShell.jsx      # Unified responsive dashboard frame
    │       ├── pages/
    │       │   ├── public/                 # Landing, Login, Register, VerifyEmail, ForgotPassword, AcceptInvite
    │       │   ├── patient/                # Dashboard, HospitalWorkspace, DoctorBooking, LiveQueue, Passport, EmergencyTracking, WaitingRoom, VideoConsultation
    │       │   ├── doctor/                 # Dashboard, Queue, ConsultationScreen, PatientProfileView, DoctorVideoConsultation
    │       │   ├── admin/                  # HospitalAdminDashboard (Overview, Doctors, Staff, Queue, Inventory, Lab, Audit)
    │       │   ├── lab/                    # LabDashboard (Requests, Fulfillment, Upload)
    │       │   ├── pharmacy/               # PharmacyDashboard (Orders, Fulfillment, Stock)
    │       │   ├── driver/                 # AmbulanceDashboard (Online Toggle, SOS Alert, Map)
    │       │   └── superadmin/             # SuperAdminDashboard (Hospitals, Users, System KPIs)
    │       ├── components/                 # Reusable UI component library (auth, booking, common, emergency, passport, queue, notifications)
    │       ├── hooks/                      # Custom hooks (useAuth, useNotifications, useDoctorQueue, useGeolocation, useDebounce)
    │       ├── services/                   # Axios API service integrations
    │       ├── store/                      # Zustand persistent stores (authStore, notificationStore)
    │       └── utils/                      # Constants, distance calculators, role helpers
    │
    ├── scripts/                            # DevOps & Mobile Testing Scripts
    │   ├── dev-tunnel.js                   # Cloudflare tunnel launcher for remote/mobile testing
    │   └── tunnel-e2e-test.js              # Automated tunnel connectivity test
    │
    ├── tools/                              # Local binaries (cloudflared.exe for Windows)
    │
    └── docs/                               # Architectural audits & technical reports
        ├── API-INTEGRATION-AUDIT.md
        ├── AUTH-AUTHORIZATION-AUDIT.md
        ├── CODEBASE-UNDERSTANDING.md
        ├── COMPLETE-WORKFLOW-AUDIT.md
        ├── FINAL-REPORT.md                 # 24-item production repair report (R1–R24)
        ├── GOOGLE-MAPS-INTEGRATION-PLAN.md
        ├── LOCAL_TUNNELING.md
        ├── MANUAL-E2E-TEST-PLAN.md
        ├── MASTER-REPAIR-PLAN.md
        ├── REALTIME-AUDIT.md
        └── ROUTE-AUDIT.md
```

---

## 10. Authentication, Authorization & Security

```
                                  AUTHENTICATION ARCHITECTURE
  
       Patient Register             Credentials Login            Google OAuth 2.0
              │                             │                            │
      [Zod Validation]             [bcrypt Hash Check]          [verifyIdToken Audiences]
              │                             │                            │
      [6-Digit Email OTP]           [Status Verification]        [User Auto-Provision]
              │                             │                            │
              └─────────────────────────────┴────────────────────────────┘
                                            │
                             [Dual-Token Issuance]
                             ├── Access Token:  15m lifetime (Bearer Authorization)
                             └── Refresh Token: 30d lifetime (httpOnly Secure Cookie + DB Hash)
                                            │
                                [Silent Axios Refresh]
                             (Transparent 401 Interception)
```

### Security & Hardening Features

1. **Dual JWT Token Architecture with Silent Refresh:**
   - **Access Token:** Short-lived (15 minutes), containing `{ sub: userId, role }`.
   - **Refresh Token:** Long-lived (30 days), stored as a SHA-256 hash in the `refresh_tokens` table.
   - **Silent Refresh Interceptor:** The frontend Axios instance detects `401 Unauthorized` responses on protected endpoints, queues concurrent API calls, requests a new access token via `POST /api/auth/refresh-token`, and seamlessly replays queued requests without forcing user logout.
2. **Strict Multi-Tenant Hospital Isolation:**
   - Staff roles (`DOCTOR`, `HOSPITAL_ADMIN`, `RECEPTIONIST`, `PHARMACIST`, `LAB_STAFF`, `AMBULANCE_DRIVER`) are scoped by `scopeToHospital` middleware, extracting the authenticated staff member's `hospitalId`.
   - Service layers enforce a **default-deny** policy: staff cannot read or mutate records belonging to other hospitals.
3. **IDOR & PHI Protection:**
   - Patients can only query their own bills, consultations, appointments, and passports (`WHERE patientId = req.user.id`).
   - Doctors can only view patient Healthcare Passports if an active `PassportConsent` record exists for that doctor or hospital.
4. **Rate Limiting & Abuse Prevention:**
   - General auth routes: throttled to 15 requests per 15 minutes.
   - Sensitive OTP endpoints (resend, password reset): throttled to 5 requests per 15 minutes.
5. **Secure Input & Output Sanitization:**
   - Request bodies parsed and strictly typed via Zod schemas.
   - Internal Prisma database column names (`err.meta.target`) and server stack traces are completely masked from production responses.

---

## 11. Database Architecture & Data Model

The PostgreSQL database is modeled and managed via Prisma ORM (`backend/prisma/schema.prisma`), spanning **34+ models and 15+ enums**.

```mermaid
erDiagram
    USER ||--o| PATIENT_PROFILE : has
    USER ||--o| DOCTOR : "is (if DOCTOR)"
    USER ||--o| HOSPITAL_ADMIN : "is (if HOSPITAL_ADMIN)"
    USER ||--o| RECEPTIONIST : "is (if RECEPTIONIST)"
    USER ||--o| PHARMACIST : "is (if PHARMACIST)"
    USER ||--o| LAB_STAFF : "is (if LAB_STAFF)"
    USER ||--o| AMBULANCE_DRIVER : "is (if DRIVER)"
    
    HOSPITAL ||--o{ DEPARTMENT : contains
    HOSPITAL ||--o{ DOCTOR : employs
    HOSPITAL ||--o{ AMBULANCE : owns
    HOSPITAL ||--o{ MEDICINE : stocks
    HOSPITAL ||--o{ LAB_TEST_CATALOG : offers
    AMBULANCE_DRIVER ||--o| AMBULANCE : drives

    USER ||--o{ APPOINTMENT : books
    DOCTOR ||--o{ APPOINTMENT : attends
    DOCTOR ||--o{ DOCTOR_AVAILABILITY : sets
    APPOINTMENT ||--o| QUEUE_TOKEN : generates
    APPOINTMENT ||--o| CONSULTATION : leads_to
    APPOINTMENT ||--o| ONLINE_SESSION : hosts
    
    CONSULTATION ||--o| PRESCRIPTION : writes
    PRESCRIPTION ||--o{ PRESCRIPTION_ITEM : itemizes
    PRESCRIPTION ||--o| PHARMACY_ORDER : generates
    PHARMACY_ORDER ||--o{ PHARMACY_ORDER_ITEM : itemizes
    PHARMACY_ORDER_ITEM }o--|| MEDICINE : references
    
    CONSULTATION ||--o{ LAB_REQUEST : orders
    LAB_REQUEST ||--o{ LAB_REQUEST_ITEM : itemizes
    LAB_REQUEST ||--o{ LAB_REPORT : produces
    CONSULTATION ||--o| FOLLOW_UP_RECOMMENDATION : creates

    USER ||--o| HEALTHCARE_PASSPORT : owns
    HEALTHCARE_PASSPORT ||--o{ PASSPORT_CONSENT : grants
    HEALTHCARE_PASSPORT ||--o{ MEDICAL_TIMELINE_EVENT : logs

    USER ||--o{ BILL : owes
    HOSPITAL ||--o{ BILL : charges
    BILL ||--o{ BILL_ITEM : contains
    BILL ||--o{ PAYMENT : settles

    USER ||--o{ EMERGENCY_REQUEST : triggers
    EMERGENCY_REQUEST }o--o| AMBULANCE : dispatches
    
    USER ||--o{ NOTIFICATION : receives
    HOSPITAL ||--o{ AUDIT_LOG : records
```

### Key Schema Entities Reference

| Model | Table | Primary Purpose & Key Fields |
|---|---|---|
| `User` | `users` | Core identity record (`id`, `email`, `passwordHash`, `role`, `authProvider`, `isEmailVerified`, `status`). |
| `PatientProfile` | `patient_profiles` | Extended demographic and emergency contact information (`bloodGroup`, `dateOfBirth`, `phone`, `city`). |
| `Hospital` | `hospitals` | Root multi-tenant boundary (`name`, `city`, `latitude`, `longitude`, `specialities`, `contactPhone`). |
| `Doctor` | `doctors` | Physician profile (`specialization`, `consultationFee`, `acceptsLiteAppointments`, `liteConsultationFee`). |
| `Appointment` | `appointments` | Booked clinical encounter (`scheduledDate`, `scheduledTime`, `fee`, `status`, `appointmentType`, `consultationType`). |
| `QueueToken` | `queue_tokens` | Real-time queue position with **Float** token numbering (`tokenNumber`, `queueDate`, `status`, `calledAt`). |
| `Consultation` | `consultations` | Core clinical record (`symptoms`, `diagnosis`, `notes`, `treatmentPlan`, `status`). |
| `OnlineSession` | `online_sessions` | WebRTC online telemedicine session metadata (`roomId`, `status`, `scheduledStart`, `startedAt`, `endedAt`). |
| `Prescription` | `prescriptions` | Digital prescription produced by a doctor (`generalInstructions`, `items`). |
| `PharmacyOrder` | `pharmacy_orders` | Dispensing order linked to a prescription (`status`, `totalAmount`, `isPaid`, `items`). |
| `Medicine` | `medicines` | Hospital pharmacy stock inventory (`name`, `genericName`, `unit`, `price`, `stockQuantity`). |
| `LabRequest` | `lab_requests` | Diagnostic order created by a physician (`priority`, `status`, `items`, `reports`). |
| `LabReport` | `lab_reports` | Diagnostic result file record (`reportFileUrl`, `resultSummary`, `reportDate`, `uploadedByUserId`). |
| `HealthcarePassport`| `healthcare_passports` | Patient's longitudinal health record (`allergies`, `medicalConditions`, `currentMedications`). |
| `PassportConsent` | `passport_consents` | Patient-granted revocable authorization for doctors/hospitals (`grantedAt`, `revokedAt`). |
| `MedicalTimelineEvent`| `medical_timeline_events` | Polymorphic clinical timeline history (`eventType`, `sourceId`, `title`, `eventDate`). |
| `Bill` | `bills` | Unified payable record (`sourceType`, `sourceId`, `subtotal`, `discount`, `tax`, `total`, `status`). |
| `Payment` | `payments` | Razorpay transaction settlement record (`razorpayOrderId`, `razorpayPaymentId`, `status`). |
| `EmergencyRequest` | `emergency_requests` | SOS ambulance dispatch lifecycle (`latitude`, `longitude`, `status`, `ambulanceId`, `acceptedAt`, `arrivedAt`). |
| `Ambulance` | `ambulances` | GPS-tracked vehicle (`vehicleNumber`, `isOnline`, `currentLatitude`, `currentLongitude`, `locationUpdatedAt`). |
| `AuditLog` | `audit_logs` | Immutable administrative action trail (`actorUserId`, `action`, `targetType`, `metadata`). |

---

## 12. API Architecture & Endpoint Reference

The backend exposes 34 RESTful route groups mounted under `/api` in `backend/src/routes/index.js`.

### 1. Authentication (`/api/auth`)
- `POST /api/auth/register` — Patient registration; sends 6-digit OTP via email.
- `POST /api/auth/verify-otp` — Verifies email OTP; activates account and issues initial JWT pair.
- `POST /api/auth/login` — Password authentication; returns user profile and sets refresh cookie.
- `POST /api/auth/google` — Google OAuth 2.0 login/registration via verified ID token.
- `POST /api/auth/refresh-token` — Silent token renewal using database-backed refresh token.
- `POST /api/auth/forgot-password` — Initiates password reset OTP flow.
- `POST /api/auth/verify-reset-otp` — Verifies reset OTP and grants password update token.
- `POST /api/auth/reset-password` — Sets new password and revokes all active refresh tokens.
- `POST /api/auth/logout` — Revokes refresh token and clears auth cookie.
- `GET /api/auth/me` — Returns current authenticated user profile and active permissions.

### 2. Hospitals & Staff (`/api/hospitals`, `/api/departments`, `/api/doctors`, `/api/staff`)
- `GET /api/hospitals` — Lists all hospitals (supports city filtering and geolocation sorting).
- `GET /api/hospitals/nearby` — Queries nearest hospitals relative to client latitude/longitude.
- `POST /api/hospitals` — `[SUPER_ADMIN]` Creates a new hospital tenant.
- `PUT /api/hospitals/:id` — `[SUPER_ADMIN]` Updates hospital details.
- `GET /api/departments` — Lists hospital clinical departments.
- `POST /api/departments` — `[HOSPITAL_ADMIN]` Creates a department within the admin's hospital.
- `GET /api/doctors` — Lists active doctors (filterable by hospital and specialization).
- `GET /api/doctors/:id` — Returns doctor profile, consultation fee, and active weekly availability.
- `POST /api/staff/invite` — `[HOSPITAL_ADMIN]` Invites staff member (Pharmacist, Lab, Receptionist, Driver).
- `GET /api/staff` — `[HOSPITAL_ADMIN]` Lists staff roster for the authenticated hospital.

### 3. Appointments & Availability (`/api/availability`, `/api/appointments`)
- `GET /api/availability/:doctorId/slots?date=YYYY-MM-DD` — Generates real-time available time slots.
- `POST /api/appointments/initiate` — `[PATIENT]` Begins regular booking (creates `Appointment` & `Bill`).
- `POST /api/appointments/lite` — `[PATIENT]` Initiates a fractional Lite Walk-In appointment.
- `GET /api/appointments` — Lists user-specific or hospital-specific appointments.
- `GET /api/appointments/:id` — Returns single appointment details with double-booking verification.
- `POST /api/appointments/:id/cancel` — `[PATIENT]` Cancels booked appointment and recalculates queue.

### 4. OPD Live Queue Management (`/api/queue`, `/api/admin/queue`)
- `GET /api/queue/doctor/:doctorId` — `[DOCTOR]` Fetches active queue list for today.
- `GET /api/queue/patient/:appointmentId` — `[PATIENT]` Fetches live position, called token, and wait ETA.
- `POST /api/queue/call-next` — `[DOCTOR]` Calls the next waiting patient (broadcasts via WebSocket).
- `POST /api/queue/:id/start` — `[DOCTOR]` Marks token as `IN_PROGRESS` and opens consultation session.
- `POST /api/queue/:id/complete` — `[DOCTOR]` Marks consultation completed and closes token.
- `POST /api/queue/:id/skip` — `[DOCTOR]` Skips absent patient and pushes to skipped queue.
- `GET /api/admin/queue` — `[HOSPITAL_ADMIN]` Hospital-wide live queue overview across all departments.
- `POST /api/admin/queue/:id/force-skip` — `[HOSPITAL_ADMIN]` Administrative queue override (audit logged).

### 5. Clinical Suite & Telemedicine (`/api/consultations`, `/api/prescriptions`, `/api/online-sessions`)
- `POST /api/consultations/start` — `[DOCTOR]` Opens consultation record for an appointment.
- `PATCH /api/consultations/:id` — `[DOCTOR]` Autosaves symptoms, diagnosis, and treatment plan.
- `POST /api/consultations/:id/complete` — `[DOCTOR]` Finalizes clinical consultation.
- `POST /api/prescriptions` — `[DOCTOR]` Creates digital prescription and auto-spawns pharmacy order.
- `GET /api/online-sessions/:appointmentId` — Fetches metadata for an online video consultation.
- `POST /api/online-sessions/:appointmentId/join` — Validates participant and registers room join.
- `POST /api/online-sessions/:appointmentId/start` — `[DOCTOR]` Starts WebRTC video session.
- `POST /api/online-sessions/:appointmentId/end` — `[DOCTOR]` Concludes telemedicine session.

### 6. Pharmacy & Laboratory (`/api/pharmacy-orders`, `/api/medicines`, `/api/lab-requests`, `/api/lab-fulfillment`)
- `GET /api/pharmacy-orders` — Lists pharmacy orders (scoped by role and hospital).
- `PUT /api/pharmacy-orders/:id/status` — `[PHARMACIST]` Advances status (`PREPARING`, `PACKED`, `READY`, `COMPLETED`).
- `GET /api/medicines` — Lists hospital pharmacy inventory.
- `POST /api/medicines` — `[HOSPITAL_ADMIN / PHARMACIST]` Adds medicine item and stock quantity.
- `POST /api/lab-requests` — `[DOCTOR]` Issues diagnostic lab test request.
- `POST /api/lab-fulfillment/:id/collect` — `[LAB_STAFF]` Marks diagnostic sample collected.
- `POST /api/lab-fulfillment/:id/process` — `[LAB_STAFF]` Marks sample under processing.
- `POST /api/lab-fulfillment/:id/upload-report` — `[LAB_STAFF]` Uploads report PDF and completes request.

### 7. Unified Billing & Payments (`/api/billing`, `/api/bills`, `/api/payments`)
- `POST /api/billing/pay` — `[PATIENT]` Initiates unified bill settlement via Razorpay.
- `POST /api/billing/verify` — `[PATIENT]` Verifies HMAC signature, marks bill `PAID`, and triggers `onBillPaid`.
- `GET /api/bills` — Lists patient bills or hospital revenue ledger.
- `GET /api/bills/:id` — Fetches itemized bill details with default-deny permission check.

### 8. Emergency SOS & Ambulances (`/api/emergency`, `/api/driver`, `/api/ambulances`)
- `POST /api/emergency` — `[PATIENT]` Broadcasts SOS; calculates nearest drivers via Haversine search.
- `GET /api/emergency/active` — `[PATIENT]` Fetches current active emergency request status.
- `GET /api/driver/me` — `[AMBULANCE_DRIVER]` Rehydrates driver profile, vehicle, and active trip on reload.
- `POST /api/driver/toggle-online` — `[AMBULANCE_DRIVER]` Toggles vehicle availability in the city network.
- `POST /api/driver/location` — `[AMBULANCE_DRIVER]` Broadcasts live GPS coordinates (`lat`, `lng`).
- `POST /api/driver/accept/:id` — `[AMBULANCE_DRIVER]` Atomically claims dispatch request.
- `POST /api/driver/en-route/:id` | `picked-up/:id` | `arrived/:id` — `[AMBULANCE_DRIVER]` Advances ride lifecycle.

### 9. Healthcare Passport & Medical Timeline (`/api/passport`, `/api/ai`)
- `GET /api/passport` — `[PATIENT]` Fetches own Healthcare Passport.
- `PUT /api/passport` — `[PATIENT]` Updates allergies, medical conditions, and medications.
- `GET /api/passport/:patientId` — `[DOCTOR]` Reads patient passport (strictly gated by active consent).
- `POST /api/passport/consent` — `[PATIENT]` Grants temporary/permanent consent to doctor or hospital.
- `DELETE /api/passport/consent/:id` — `[PATIENT]` Revokes access consent immediately.
- `POST /api/ai/triage` — Analyzes natural language symptoms and recommends clinical specialty & urgency.

---

## 13. Major Functional Modules

### 1. Patient Portal & Care Hub
- **Universal Healthcare Passport:** A unified repository of allergies, chronic conditions, and active prescriptions accessible across participating hospitals.
- **Interactive Map Discovery:** Browse hospitals across Vadodara with dynamic distance computation, department filters, and doctor rating displays.
- **Dynamic Slot Selector:** Calendar-based slot picker that prevents double-booking and automatically excludes doctor lunch intervals.
- **Medicine Reminder System:** Automatically creates dose schedules from digital prescriptions with marked/taken compliance tracking.

### 2. Doctor Clinical Suite
- **Queue Commander:** Real-time view of today's patients, displaying regular tokens and fractional Lite appointments, with one-click patient calling.
- **Integrated Consultation Desk:** Split-screen layout combining patient history review with autosaving clinical notes, prescription builder, lab requisition, and follow-up scheduler.

### 3. Hospital Operations & Administration
- **Live Queue Oversight:** Real-time monitoring of all OPD rooms with administrative force-skip and emergency priority handling.
- **Closed-Loop Pharmacy & Lab Fulfillment:** Step-by-step verification, sample handling, and PDF report delivery linked to patient timelines.
- **Enterprise Analytics:** Revenue breakdown, appointment conversion metrics, OPD wait times, and immutable audit logs.

### 4. Real-Time Emergency Network
- **3-Second Hold SOS Trigger:** Prevents accidental triggers while enabling rapid single-action dispatch during acute crises.
- **Haversine Geo-Dispatch Engine:** Real-time mathematical search across all active ambulances in the city network.
- **Live GPS Navigation Map:** Built with Google Maps JavaScript API, showing dynamic driver markers, route polylines, and distance-based ETA.

---

## 14. External Integrations

| Service | Purpose in HealthCare+ | Required Keys / Configuration |
|---|---|---|
| **Google Maps Platform** | Live ambulance tracking map, route polyline rendering, and hospital location pins. | `VITE_GOOGLE_MAPS_API_KEY` (Maps JavaScript API & Directions API enabled). |
| **Razorpay** | Unified payment checkout for appointments, medicine orders, and diagnostic tests. | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `VITE_RAZORPAY_KEY_ID` (Mock mode supported if keys omitted). |
| **Google Identity Services** | One-tap Google OAuth 2.0 patient authentication. | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `VITE_GOOGLE_CLIENT_ID`. |
| **Nodemailer / SMTP** | Automated delivery of 6-digit registration OTPs, staff invites, and clinical notification emails. | `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD` (or `RESEND_API_KEY`). |
| **Cloudflare Quick Tunnels** | Exposes local development server over HTTPS to test live GPS streaming and WebRTC across physical mobile devices. | `tools/cloudflared.exe` (Invoked via `npm run dev:tunnel`). |

---

## 15. Environment Variables Configuration

### Backend Configuration (`backend/.env`)

Create `backend/.env` based on `backend/.env.example`:

```env
# Server & Environment
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DEMO_MODE=true

# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/healthcare_plus?schema=public"

# JWT Authentication (Generate high-entropy random strings in production)
JWT_SECRET=dev_jwt_secret_key_change_in_production_32chars!
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_key_change_in_production_32chars!
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth 2.0 (Optional in dev)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email / SMTP Configuration (Optional in dev - OTP logs to terminal)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM="HealthCare+ <no-reply@healthcareplus.local>"
RESEND_API_KEY=
OTP_TTL_MINUTES=10

# Razorpay Payment Gateway (Optional in dev - falls back to built-in simulation)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Cloud Storage & AI Placeholders
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
AI_API_KEY=
```

### Frontend Configuration (`frontend/.env`)

Create `frontend/.env` based on `frontend/.env.example`:

```env
# Backend API Base URL
VITE_API_URL=http://localhost:5000/api

# Google Maps API Key (Required for live ambulance GPS tracking)
VITE_GOOGLE_MAPS_API_KEY=

# Google OAuth Client ID (Optional in dev)
VITE_GOOGLE_CLIENT_ID=

# Razorpay Key ID (Optional in dev)
VITE_RAZORPAY_KEY_ID=
```

---

## 16. Installation & Setup Guide

### Prerequisites
- **Node.js:** `≥ 18.0.0` (LTS recommended)
- **PostgreSQL:** `v14+` running locally or via Docker
- **Git:** Installed and configured
- **Package Manager:** `npm` (included with Node.js)

---

### Step 1: Clone Repository & Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd HealthCare+/healthcare-plus

# Install root dependencies
npm install

# Install Backend dependencies
cd backend
npm install

# Install Frontend dependencies
cd ../frontend
npm install
cd ..
```

---

### Step 2: Configure Environment Files

1. Copy and configure backend environment variables:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Copy and configure frontend environment variables:
   ```bash
   cp frontend/.env.example frontend/.env
   ```

---

### Step 3: Database Migration & Seeding

Ensure your PostgreSQL instance is running and the database specified in `DATABASE_URL` exists.

```bash
cd backend

# Run Prisma schema migrations
npx prisma migrate dev --name init

# Seed comprehensive Vadodara demo network (Hospitals, Doctors, Staff, Patients, Queues)
npx prisma db seed

cd ..
```

---

### Step 4: Run the Application

#### Option A: Standard Local Development (Separate Terminals)

**Terminal 1 (Backend API & WebSockets):**
```bash
cd backend
npm run dev
# Express API & Socket.IO server running at http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
# Vite development server running at http://localhost:5173
```

#### Option B: Mobile / Cross-Device Testing with Cloudflare Tunnel

To test live ambulance GPS broadcasting and WebRTC video consultations across real mobile phones and external networks:

```bash
# From healthcare-plus/ root directory
npm run dev:tunnel
```
*This automatically starts the backend, Vite dev server, and creates an authenticated Cloudflare HTTPS quick tunnel URL (e.g., `https://random-name.trycloudflare.com`).*

---

## 17. Seeded Demo Environment & Pilot Network

The database seeder (`backend/prisma/seed.js`) populates a realistic healthcare network in **Vadodara, Gujarat**.

> 🔑 **Default Password for ALL Seeded Accounts:** `Password123!`

### 1. Administrative Accounts

| Role | Name | Email | Associated Scope |
|---|---|---|---|
| **Super Admin** | Super Admin | `superadmin@healthcareplus.dev` | Global Platform Network |
| **Hospital Admin** | Vikramaditya Admin | `admin@sterling.dev` | Sterling Hospital, Vadodara |

### 2. Primary Demo Patient

| Role | Name | Email | Features Ready to Demo |
|---|---|---|---|
| **Patient** | Rahul Verma | `patient@healthcareplus.dev` | Active Appointments, Queue Token #23, Healthcare Passport, Medical Timeline, Active Bills |

### 3. Clinical Specialists (Sample of 28 Seeded Doctors)

| Doctor Name | Email | Specialization | Hospital |
|---|---|---|---|
| **Dr. Anil Shah** | `dr.anil.shah@sterling.dev` | Cardiology | Sterling Hospital |
| **Dr. Meena Patel** | `dr.meena.patel@sterling.dev` | Neurology | Sterling Hospital |
| **Dr. Karan Desai** | `dr.karan.desai@sterling.dev` | Orthopedic Surgeon | Sterling Hospital |
| **Dr. Sanjay Verma** | `dr.sanjay.verma@sterling.dev` | General Physician | Sterling Hospital |
| **Dr. Neha Joshi** | `dr.neha.joshi@sunshine.dev` | Pediatrics | Sunshine Global Hospital |
| **Dr. Amit Trivedi** | `dr.amit.trivedi@bhailal.dev` | Gastroenterology | Bhailal Amin Hospital |

### 4. Operational Staff (Sterling Hospital)

| Role | Name | Email | Workflow Function |
|---|---|---|---|
| **Receptionist** | Anita Roy | `receptionist@sterling.dev` | OPD Check-ins & Queue Issuance |
| **Pharmacist** | Ramesh Gupta | `pharmacist@sterling.dev` | Prescription Fulfillment & Stock |
| **Lab Staff** | Suresh Kumar | `labstaff@sterling.dev` | Diagnostic Testing & PDF Reports |
| **Ambulance Driver**| Mahesh Driver | `driver@sterling.dev` | SOS Dispatch & Live GPS (`GJ-01-AB-1234`) |

### 5. Automated Demo Day Rolling (`DEMO_MODE=true`)
HealthCare+ includes an intelligent demo middleware (`backend/src/services/demo.service.js`). When `DEMO_MODE=true`, the backend automatically detects date rollovers and rolls unresolved demo appointments to **Today**, ensuring seeded queues and appointments remain active and testable at all times.

---

## 18. Testing & Quality Assurance

### Backend Unit & Integration Tests (Jest)
The backend features 11 test suites covering authentication, authorization, hospital isolation, billing, emergency dispatch, and clinical workflows.

```bash
cd backend
npm test
```

### Static Analysis & Linting
Frontend static code analysis is verified via `oxlint`:

```bash
cd frontend
npm run lint
```

### Manual End-to-End Verification Matrix
For comprehensive step-by-step role verification, consult [`docs/MANUAL-E2E-TEST-PLAN.md`](./healthcare-plus/docs/MANUAL-E2E-TEST-PLAN.md) and [`docs/FINAL-REPORT.md`](./healthcare-plus/docs/FINAL-REPORT.md).

---

## 19. Current Implementation Status

### ✅ Fully Implemented & Verified in Codebase
- [x] Multi-tenant hospital isolation with RBAC across 8 user roles.
- [x] Dual JWT auth with silent refresh, password reset OTPs, and Google OAuth 2.0.
- [x] Vadodara pilot network with 8 hospitals and 28 doctors across 12 specialties.
- [x] Real-time Live OPD Queue management with Socket.IO room sync.
- [x] **Fractional Queue Intelligence ("Lite Appointments")** with float tokens (e.g. #15.5).
- [x] Doctor Consultation Desk with clinical notes autosave, digital prescriptions, and lab orders.
- [x] Closed-loop Pharmacy fulfillment workflow with medicine inventory stock management.
- [x] Laboratory diagnostic fulfillment workflow with PDF report upload and viewing.
- [x] Unified Billing engine routing Appointment, Pharmacy, and Lab payables through Razorpay.
- [x] Emergency SOS with nearest-driver Haversine search, atomic claim, and 3-minute 108 fallback.
- [x] Live GPS tracking on Google Maps with real-time driver coordinate broadcasting.
- [x] Healthcare Passport with longitudinal Medical Timeline and granular consent enforcement.
- [x] WebRTC Telemedicine video consultation suite with waiting room (Phase 16).
- [x] AI Symptom Triage engine mapping natural language symptoms across 12 specialties.
- [x] Cloudflare quick tunneling script for mobile and cross-network HTTPS testing.

### ⚠️ Minor Implementation Nuances
- **AI Symptom Triage:** Built as a deterministic rule-based keyword matcher across 12 medical specialties; external LLM API calling (`AI_API_KEY`) is architected as a drop-in upgrade.
- **Diagnostic File Storage:** Lab report PDFs are stored on the local backend disk (`backend/uploads/`) with static serving; Cloudinary integration (`CLOUDINARY_*`) is templated for cloud scaling.
- **Socket.IO Single Node:** Operates in-memory; horizontal multi-instance scaling requires attaching `@socket.io/redis-adapter`.

---

## 20. Future Roadmap (Specification vs Codebase)

The following capabilities represent the planned roadmap outlined in the Hackathon project vision:

- [ ] **ABDM / ABHA / FHIR Interoperability:** Integration with India's Ayushman Bharat Digital Mission for national health ID linking.
- [ ] **LLM Clinical Diagnostic Assistant:** Upgrading symptom triage to a fine-tuned medical LLM for differential diagnostic suggestions.
- [ ] **Automated CAD Emergency Dispatch:** Algorithmic computer-aided dispatch with automated emergency vehicle routing.
- [ ] **Wearable Health Sync:** Automated ingestion of continuous vitals from Apple Health, Google Fit, and smart wearables into the Healthcare Passport.
- [ ] **Insurance API Integration:** Direct cashless insurance pre-authorization and claim settlement.
- [ ] **Multi-City Expansion:** Scaling network federation from Vadodara to Ahmedabad, Surat, Mumbai, and pan-India.

---

## 21. Troubleshooting Guide

| Issue | Potential Cause | Verified Resolution |
|---|---|---|
| **Prisma Connection Error (`P1001`)** | PostgreSQL service not running or invalid `DATABASE_URL`. | Ensure PostgreSQL is active on port 5432. Verify credentials in `backend/.env`. |
| **CORS Block on API Requests** | `CLIENT_URL` mismatch or frontend on unexpected port. | Verify `CLIENT_URL=http://localhost:5173` in `backend/.env`. |
| **Token Expired / 401 Loop** | Expired access token with missing refresh token. | Check that `POST /api/auth/refresh-token` is reaching backend. Clear browser storage and log in again. |
| **Google Maps Not Rendering** | Missing or invalid Maps API key. | Ensure `VITE_GOOGLE_MAPS_API_KEY` is set in `frontend/.env` and *Maps JavaScript API* is enabled. |
| **Socket.IO Not Connecting** | Port mismatch or invalid auth token in handshake. | Verify backend is running on port 5000. Inspect browser console for WebSocket connection status. |
| **Email OTP Not Arriving** | SMTP credentials unconfigured in development. | In development mode, check the **backend console terminal** — the 6-digit OTP code is logged directly to stdout. |

---

## 22. Contributing Guidelines

1. **Fork & Branch:** Create a feature branch (`git checkout -b feature/amazing-feature`).
2. **Adhere to Layering:** Keep controllers thin; place all database transactions and business rules inside `backend/src/services/`.
3. **Preserve Isolation:** Never bypass `scopeToHospital` or default-deny security patterns.
4. **Code Quality:** Run `npm test` in `backend/` and `npm run lint` in `frontend/` before opening a pull request.
5. **Atomic Commits:** Provide clear, descriptive commit messages documenting changes.

---

<p align="center">
  <b>HealthCare+</b> — <i>Healthcare should not feel like 10 different systems. One Patient. One Journey. One Connected Ecosystem.</i>
</p>
