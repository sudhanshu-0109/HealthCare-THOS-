# healthcare+ Phase 2 — Auth Wireframes & States

---

## 1. Register Page (`/register`)

```
┌──────────────────────────────────────────────────────┐
│ healthcare+                                           │
├──────────────────────────────────────────────────────┤
│                                                       │
│   ┌──────────────────────────────────────────────┐   │
│   │         Create your account                   │   │
│   │         Join healthcare+ and get better care │   │
│   ├──────────────────────────────────────────────┤   │
│   │                                              │   │
│   │  [  Continue with Google                  ]  │   │
│   │                                              │   │
│   │  ─────────────── or ──────────────────────  │   │
│   │                                              │   │
│   │  Full Name                                   │   │
│   │  <Your full name>                            │   │
│   │                                              │   │
│   │  Email                                       │   │
│   │  <email@example.com>                         │   │
│   │                                              │   │
│   │  Password                                    │   │
│   │  <Create a password>          [Show]         │   │
│   │                                              │   │
│   │  Confirm Password                            │   │
│   │  <Repeat password>            [Show]         │   │
│   │                                              │   │
│   │  [         Create Account      ]             │   │
│   │                                              │   │
│   │  Already have an account?  (Sign in →)       │   │
│   └──────────────────────────────────────────────┘   │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## 2. Check Your Email State (Post-Register)

```
┌──────────────────────────────────────────────────────┐
│ healthcare+                                           │
├──────────────────────────────────────────────────────┤
│                                                       │
│   ┌──────────────────────────────────────────────┐   │
│   │                     ✉️                       │   │
│   │               Check your email               │   │
│   │                                              │   │
│   │  We sent a verification link to              │   │
│   │  user@example.com                            │   │
│   │                                              │   │
│   │  Please click the link in the email to       │   │
│   │  activate your account before logging in.    │   │
│   │                                              │   │
│   │  [            Go to Login →           ]      │   │
│   └──────────────────────────────────────────────┘   │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## 3. Login Page with Inline Errors (`/login`)

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
│   │  ⚠️ Your email address has not been verified.│   │
│   │     (Resend verification email →)            │   │
│   │                                              │   │
│   │  [  Continue with Google                  ]  │   │
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
│   │  Don't have an account? (Create one →)       │   │
│   └──────────────────────────────────────────────┘   │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## 4. Forgot / Reset Password (`/forgot-password`, `/reset-password/:token`)

```
┌───────────────────────────────┐   ┌───────────────────────────────┐
│ Forgot password                │   │ Reset password                 │
│ <email>                        │   │ <new password>                 │
│ [Send reset link]              │   │ <confirm new password>         │
│ "If that email exists, a link  │   │ [Reset Password]               │
│  has been sent."                │   │                                │
└───────────────────────────────┘   └───────────────────────────────┘
```

---

## 5. 403 / Access Restricted Page (`/unauthorized`)

```
┌──────────────────────────────────────────────────────┐
│                                                       │
│   ┌──────────────────────────────────────────────┐   │
│   │                     🚫                       │   │
│   │              Access Restricted               │   │
│   │                                              │   │
│   │  Your account (PATIENT) does not have        │   │
│   │  permission to view this page.               │   │
│   │                                              │   │
│   │  [          Go to My Dashboard →          ]  │   │
│   └──────────────────────────────────────────────┘   │
│                                                       │
└──────────────────────────────────────────────────────┘
```
