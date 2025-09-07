# Eventify — Campus Event Management (Prototype)

Eventify is a campus event management application developed using the PERN stack (Postgres, Express, React, Node). The platform helps colleges streamline organizing events, student registrations, attendance, and feedback collection. The system has two main roles: students and admins. Students can register for events and submit feedback if they attended. Admins can create events, take attendance, cancel or complete events, and view statistics and reports.

## Frontend

The frontend is built with React and styled using Tailwind CSS. The interface focuses on a clean blue-and-white theme that is responsive and easy to use. Key frontend responsibilities:

- Display event lists and details to students and admins.
- Allow students to register for events and submit feedback if marked present.
- Provide an admin dashboard where admins can create events, take attendance, mark events as completed or cancelled, and view statistics.
- Use React Router for navigation and protected routes for access control.
- Use axios (or supabase-js if directly using Supabase client) for API requests and React hooks for state management.
- Maintain consistent, accessible UI components (Header, EventCard, AdminDashboard, ProtectedRoute, LogoutButton).

## Backend

The backend exposes REST endpoints (or Supabase functions) to handle authentication, events, registrations, attendance, feedback, and statistics. Key backend responsibilities:

- Authenticate users and issue JWTs (for the prototype tokens are stored in localStorage; in production prefer HttpOnly cookies and refresh tokens).
- Enforce role-based access: only admins can create events, take attendance, or access admin reports.
- Provide endpoints such as:
  - `/events` (GET, POST)
  - `/registrations/register` (POST)
  - `/attendance/:id/take` (POST)
  - `/registrations/feedback` (POST)
  - `/admin/my-stats` (GET)
- Validate inputs and handle errors to give clear responses to the frontend.
- Use Postgres (or Supabase) as the data store.

## Role-based authentication

- Students can browse events, register, and submit feedback if present.
- Admins can create and manage events, take attendance, and view reports.
- Unauthorized users attempting to reach protected pages are redirected to login.

## JWT authentication

- Authentication uses JSON Web Tokens (JWT).
- In the prototype JWTs are stored in localStorage for simplicity.
- For production, store tokens in HttpOnly cookies and use refresh tokens to reduce risk.

## AI Tools Used

I tried a few AI tools during development. Cursor and Lovable were not very helpful for this project. ChatGPT was the main tool I used for assistance with debugging, styling complex React components with Tailwind CSS, brainstorming workflows, and improving production-level logic.

## Learnings

- Implementing role-based authentication and protecting routes for different users.
- Understanding JWT authentication trade-offs and how to move from a demo implementation to a production-ready one.
- Separating and designing clear student and admin workflows.
- Building responsive interfaces with Tailwind CSS.
- Designing backend APIs, handling errors, and writing Postgres queries.
- Using AI tools effectively as an assistant for debugging and brainstorming while relying on my own implementation decisions.

## demo -  admin account to explore app  
   - userName: demoAdmin
   - password: demoAdmin@123

## demo - Student account to explore app  
   - userName: demoStudent
   - password: demoStudent@123

## Setup
1. Clone the repository  
2. Run `npm install`  
3. Create a `.env` file in the root folder and copy values from `.env.example`  
4. Run `npm start`  
