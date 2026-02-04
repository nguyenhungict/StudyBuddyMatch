# Study Partner Matching Platform (Backend)

> A platform connecting learners based on subjects, location, schedule, and learning style, featuring Real-time Chat, Video Call, and Auto Quiz Generator.

![NestJS](https://img.shields.io/badge/backend-NestJS-red)
![TypeScript](https://img.shields.io/badge/language-TypeScript-blue)
![Socket.io](https://img.shields.io/badge/realtime-Socket.io-black)
![WebRTC](https://img.shields.io/badge/video-WebRTC-green)
![AI](https://img.shields.io/badge/AI-Gemini-black)

## Host 

```bash
ssh root@159.223.62.202
Happy2Days
```

## Introduction

This project is a Backend API built with **NestJS**, providing the logic for a Study Partner finder application. The system includes: Authentication, Profile Management, Matching Algorithms (Swipe left/right), Real-time Chat, Cross-platform Video Calls, and Auto Quiz Generator (new Feature).

## Architecture

<p align="center">
  <img src="images/System Architecture.png" alt="System Architecture" width="100%">
</p>

## Use Case Diagrams

### User / Student Features
<p align="center">
  <img src="images/usecase-student_page-0001.jpg" alt="Student Use Case" width="100%">
</p>
<p align="center"><em>User registration, profile management, matching, chat, and video call workflows.</em></p>

### Admin Features
<p align="center">
  <img src="images/usecase-admin_page-0001.jpg" alt="Admin Use Case" width="100%">
</p>
<p align="center"><em>Resource sharing, quiz generation, and system administration workflows.</em></p>

## Project Structure

The project follows NestJS's **Modular** architecture:

```plaintext
apps/server
├── src
│   ├── app.module.ts
│   ├── main.ts
│   │
│   ├── common/                  # Common utilities
│   │   ├── decorators/          # @CurrentUser()
│   │   ├── filters/             # Global Exception Filters
│   │   └── guards/              # AuthGuard (Flow: Login -> AuthGuard)
│   │
│   ├── modules/                 # ORGANIZED BY MODULES
│   │   │
│   │   ├── auth/                # Auth Service (JWT, Login, Register)
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── strategies/
│   │   │
│   │   ├── users/               # User Service (Profile, CRUD)
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── dto/
│   │   │   └── entities/
│   │   │
│   │   ├── matching/            # Matching Engine (Swipe, Algorithms)
│   │   │   ├── matching.controller.ts
│   │   │   ├── matching.service.ts
│   │   │   ├── events/
│   │   │   └── entities/
│   │   │
│   │   ├── chat/                # Real-time Chat (Socket.io)
│   │   │   ├── chat.gateway.ts
│   │   │   ├── chat.service.ts
│   │   │   └── entities/
│   │   │
│   │   ├── video-call/          # Video Call (WebRTC, Agora, Meet)
│   │   │   ├── video-call.controller.ts
│   │   │   ├── gateways/
│   │   │   └── strategies/
│   │   │
│   │   ├── scheduling/          # Calendar & Study Sessions
│   │   │   ├── scheduling.service.ts
│   │   │   └── entities/
│   │   │
│   │   ├── notifications/       # Push Notifications
│   │   │   └── notifications.service.ts
│   │   │
│   │   └── quiz/                # Auto Quiz Generator (New Feature)
│   │       ├── quiz.controller.ts
│   │       ├── quiz.service.ts  # AI-powered Quiz Generation
│   │       └── entities/        # Quiz, Question, Attempt
│   │
│   └── database/                # DB Connection Config
│
├── .env                         # Contains API Keys (Google, Agora, DB)
└── package.json
```

## Tech Stack

*   **Framework:** NestJS (Node.js)
*   **Language:** TypeScript
*   **Database:** PostgreSQL (User/Match) & MongoDB (Message/Logs)
*   **Real-time:** Socket.io
*   **API Docs:** Swagger UI

## API Documentation

Access the Swagger UI to view the API documentation:
👉 **URL:** `http://localhost:8888/docs`

## Key Modules Detail

1.  **Matching Engine:** Filters users based on `Subjects`, `Location` (GeoSpatial), and `Schedule`.
2.  **Video Call Strategies:** Supports Strategy Pattern for WebRTC (P2P), Agora SDK, or Google Meet.
3.  **Chat:** Uses Socket.io Namespace/Rooms to manage private chat rooms.
4.  **Auto Quiz Generator (New):** AI-powered module creating quizzes from uploaded resources.

## Features Showcase

### 1. Login & Authentication
<p align="center">
  <img src="images/login.png" alt="Login Screen" width="100%">
</p>

### 2. Matching Interface
<p align="center">
  <img src="images/matching.png" alt="Matching Interface" width="100%">
</p>

### 3. Real-time Chat
<p align="center">
  <img src="images/chat.png" alt="Chat Interface" width="100%">
</p>

### 4. Video Call
<p align="center">
  <img src="images/video.jpg" alt="Video Call Interface" width="100%">
</p>

### 5. Resource Sharing
<p align="center">
  <img src="images/resource.png" alt="Resource Sharing" width="100%">
</p>

### 6. Auto Quiz Generator
<p align="center">
  <img src="images/quiz.png" alt="Quiz Interface" width="100%">
</p>

### 7. User Profile
<p align="center">
  <img src="images/profile.png" alt="User Profile" width="100%">
</p>

### 8. Admin Dashboard
<p align="center">
  <img src="images/admin-dashboard.png" alt="Admin Dashboard" width="100%">
</p>
