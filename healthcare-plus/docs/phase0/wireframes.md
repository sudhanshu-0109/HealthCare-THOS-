# healthcare+ — Low-Fidelity Wireframes

> ASCII wireframes for the 6 highest-priority screens.
> Width: max 80 characters. Labels: `[Button]`, `<input>`, `(link)`.

---

## 1. Landing Page

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ healthcare+                              (Login)   [Get Started Free]        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│           Find hospitals. Book doctors. Get care faster.                     │
│                                                                              │
│               [Continue with Google]     [Create Account]                   │
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │  🔍 <Search hospitals, doctors, specialties...>      [Search]      │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  🏥              │  │  🤖              │  │  🚨              │            │
│  │  Find Hospitals  │  │  AI Symptom     │  │  Emergency SOS  │            │
│  │                  │  │  Assistant      │  │                  │            │
│  │  Browse nearby   │  │  Describe       │  │  One-tap        │            │
│  │  hospitals with  │  │  symptoms, get  │  │  ambulance      │            │
│  │  live crowd info │  │  matched to     │  │  dispatch       │            │
│  │                  │  │  the right doc  │  │                  │            │
│  │  [Explore →]     │  │  [Try it →]     │  │  [Learn more →] │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│   ⭐ 50+ Hospitals   👨‍⚕️ 500+ Doctors    📋 10,000+ Patients served          │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  Footer: (About) (Privacy Policy) (Terms) (Contact)                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Login / Register Pages

```
┌──────────────────────────────────────────────────────┐
│ healthcare+                                           │
├──────────────────────────────────────────────────────┤
│                                                       │
│   ┌──────────────────────────────────────────────┐   │
│   │         Welcome back 👋                       │   │
│   │         Sign in to your account              │   │
│   ├──────────────────────────────────────────────┤   │
│   │                                              │   │
│   │  [  Continue with Google                  ]  │   │
│   │                                              │   │
│   │  ─────────────── or ──────────────────────  │   │
│   │                                              │   │
│   │  Email                                       │   │
│   │  <email@example.com>                         │   │
│   │                                              │   │
│   │  Password                                    │   │
│   │  <••••••••••••>                [Show]        │   │
│   │                                              │   │
│   │  [         Sign In         ]                 │   │
│   │                                              │   │
│   │  (Forgot password?)                          │   │
│   │                                              │   │
│   │  ─────────────────────────────────────────  │   │
│   │  Don't have an account?  (Create one →)      │   │
│   └──────────────────────────────────────────────┘   │
│                                                       │
└──────────────────────────────────────────────────────┘

── Register variant (same card, different fields): ────
│   │  Full Name                                   │   │
│   │  <Your full name>                            │   │
│   │                                              │   │
│   │  Email                                       │   │
│   │  <email@example.com>                         │   │
│   │                                              │   │
│   │  Password                                    │   │
│   │  <Create a password>        [Show]           │   │
│   │                                              │   │
│   │  Confirm Password                            │   │
│   │  <Repeat password>          [Show]           │   │
│   │                                              │   │
│   │  [         Create Account      ]             │   │
│   │                                              │   │
│   │  Already have an account?  (Sign in →)       │   │
```

---

## 3. Patient Main Dashboard

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ☰  healthcare+               🔍 Search hospitals…           🔔(3)  👤        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ 🤖 AI Health Assistant                                               │   │
│  │  <Describe your symptoms or ask a health question…>   [Ask AI]       │   │
│  │  💡 Suggested: General Physician → [View available doctors]          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Nearby Hospitals (4)                                         [See all →]   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ City General  │ │ Apollo Clinic│ │ Max HealthCare│ │ Fortis Hosp │       │
│  │ 2.1 km        │ │ 3.4 km       │ │ 4.0 km        │ │ 4.8 km      │       │
│  │ 🟢 Low queue  │ │ 🟡 Moderate  │ │ 🔴 High load  │ │ 🟢 Low queue│       │
│  │ ⭐ 4.5 (120)  │ │ ⭐ 4.2 (89)  │ │ ⭐ 4.0 (203)  │ │ ⭐ 4.6 (56) │       │
│  │ [Book →]      │ │ [Book →]     │ │ [Book →]      │ │ [Book →]    │       │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                                              │
│  My Upcoming Appointments (2)                          [View all →]         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ 📅 Aug 10 • 11:30 AM  Dr. A. Sharma  Cardiology  City General        │   │
│  │ Queue token: #7   Status: ✅ Confirmed                [View Queue]   │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │ 📅 Aug 15 • 3:00 PM   Dr. R. Iyer    Dermatology  Apollo Clinic      │   │
│  │ Status: ✅ Confirmed                               [View Queue]      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│                                            ┌──────────────────────────┐     │
│                                            │   🚨  EMERGENCY SOS       │     │
│                                            │   Hold 3 seconds to send  │     │
│                                            └──────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Hospital Workspace (Entry Screen)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Back    🏥 City General Hospital                     🔔(3)  👤             │
│           📍 MG Road, Bangalore  •  ⭐ 4.5  •  🟢 Low queue                 │
├──────────┬───────────────────────────────────────────────────────────────────┤
│          │                                                                   │
│ Doctors  │  Departments                                                      │
│          │  [General Medicine ✓] [Cardiology] [Orthopedics] [Dermatology]   │
│ Appoint- │  [Pediatrics] [Neurology] [ENT] [Ophthalmology]                  │
│  ments   │                                                                   │
│          │  ───────────────────────────────────────────────────────────────  │
│ Pharmacy │  Doctors in General Medicine (4)                                  │
│          │  ┌────────────────────────────────────────────────────────────┐   │
│ Lab      │  │ 👨‍⚕️ Dr. Ananya Sharma    │ 8 yrs  │ Cardio   │ ₹500 │ [Book]│  │
│          │  │    Available: Mon-Sat  │        │          │      │       │   │
│ Billing  │  │────────────────────────┼────────┼──────────┼──────┼───────│   │
│          │  │ 👩‍⚕️ Dr. Rajesh Iyer      │ 5 yrs  │ General  │ ₹400 │ [Book]│  │
│ Notif.   │  │    Available: Mon-Fri  │        │          │      │       │   │
│          │  │────────────────────────┼────────┼──────────┼──────┼───────│   │
│          │  │ 👨‍⚕️ Dr. Priya Menon      │ 12 yrs │ General  │ ₹600 │ [Book]│  │
│          │  │    Available: Tue-Sat  │        │          │      │       │   │
│          │  └────────────────────────────────────────────────────────────┘   │
│          │                                                                   │
│          │  ← Previous    Page 1 of 1    Next →                             │
└──────────┴───────────────────────────────────────────────────────────────────┘
```

---

## 5. Doctor Dashboard (Queue View)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ healthcare+ (Doctor)   Dr. Rajesh Iyer · General Medicine    🔔(1)  👤       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Today's Queue — Mon Aug 8 2026           Total: 12   Remaining: 5          │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  🟢 CURRENT  #7  Ravi Kumar        DOB: 12-Mar-1985   M             │   │
│  │              Chief: Fever, cold, headache for 3 days                │   │
│  │              [ Start Consultation ]   [ Skip ]                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Waiting                                                             │   │
│  │  #8   Anita Singh          10:45 AM token   (waiting)               │   │
│  │  #9   Mohit Verma           11:00 AM token   (waiting)               │   │
│  │  #10  Sunita Rao            11:15 AM token   (waiting)               │   │
│  │  #11  Deepak Gupta          11:30 AM token   (waiting)               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Completed (7):  #1 ✓  #2 ✓  #3 ✓  #4 ✓  #5 ✓  #6 ✓  (skipped: #4)       │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│  [ Call Next (#8) ]   [ Complete Consultation ]   [ Pause Queue ]           │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Hospital Admin Dashboard

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ healthcare+ (Admin)   City General Hospital                   🔔(2)  👤      │
│ Mon, Aug 8 2026                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Today at a Glance                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ 📅            │  │ 👨‍⚕️            │  │ 💰            │  │ ⏱            │  │
│  │ 84            │  │ 12           │  │ ₹1,24,000    │  │ 18 min       │  │
│  │ Appointments  │  │ Active Docs  │  │ Revenue      │  │ Avg wait     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Queue Load    │  │ Pharmacy     │  │ Lab Requests  │  │ Emergency    │  │
│  │ 🟡 Moderate   │  │ 14 pending   │  │ 6 pending     │  │ 0 active     │  │
│  │ [View Queue]  │  │ [View Orders]│  │ [View Lab]    │  │ [View Emerg] │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Quick Actions                                                               │
│  [+ Add Doctor]  [+ Add Department]  [+ Add Staff]  [View Analytics]        │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Recent Activity                                                             │
│  • 10:32 AM  Walk-in patient added to Dr. Iyer's queue (#12)                │
│  • 10:15 AM  Lab report uploaded — Ravi Kumar (Blood CBC)                   │
│  • 09:55 AM  Payment received ₹500 — Appointment #A-2047                   │
│  • 09:40 AM  Emergency SOS resolved — Patient Anita Singh                   │
└──────────────────────────────────────────────────────────────────────────────┘
```
