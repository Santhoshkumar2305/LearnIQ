# Smart Learning Management System (SLMS)

A feature-rich, premium Smart Learning Management System (SLMS) built using the **MERN Stack** (MongoDB, Express.js, React + Vite, Node.js) with real-time notifications via Socket.io and AI-assisted grading/summarization capabilities using the **Groq API** (Llama-3 models).

---

## 📂 Project Structure & File Analysis

This project is divided into two primary subdirectories: `client` (React frontend) and `server` (Express API backend).

### 🖥️ Client (Frontend) Architecture
The client application is initialized with Vite + React. It uses Redux Toolkit for state management, Axios for network requests, and standard CSS for premium visuals.

- **`client/src/main.jsx`**: Bootstraps the React application into the DOM. Wraps the root with the Redux store provider and custom context providers.
- **`client/src/App.jsx`**: Handles routing using React Router. Defines public routes (Login, Signup, Landing), private protected routes, and role-based restricted routes.
- **`client/src/index.css`**: Contains global stylesheets, CSS variables (color palette, fonts), responsive styling, and modern premium animations (glassmorphism cards, interactive button glows, custom scrolls).
- **`client/src/components/`**:
  - `Navbar.jsx` / `Navbar.css`: Header navbar featuring active routes, logged-in profile indicators, and a real-time notification bell dropdown.
  - `LoadingSpinner.jsx` / `LoadingSpinner.css`: Premium animated loading screen for asynchronous tasks.
  - `ProtectedRoute.jsx`: Higher-Order Route Guard checking authentication tokens and verifying authorization based on student, teacher, or admin roles.
- **`client/src/layouts/`**:
  - `MainLayout.jsx` / `MainLayout.css`: The shell containing the main dashboard structure, side panels, and responsive wrapper margins.
- **`client/src/redux/`**:
  - `store.js`: Registers application-wide Redux slices.
  - `slices/authSlice.js`: Manages login/logout status, stores the user session details, and handles token persistence in `localStorage`.
- **`client/src/services/`**:
  - `api.js`: Standard Axios instance configured with a base URL and an interceptor that automatically appends the JWT bearer token to the header of every request.
  - `courseService.js`: API wrapper functions for courses (fetching courses, joining via code, taking quizzes, uploading files).
  - `submissionService.js`: API endpoints for student assignment submissions, retrieving teacher files, fetching AI reviews, and saving final grades.
  - `analyticsService.js`: API wrapper for requesting student, teacher, or admin dashboard statistics.
  - `notificationService.js`: Retrieves in-app alerts and marks notifications as read.
- **`client/src/pages/`**:
  - `LandingPage.jsx` / `LandingPage.css`: Professional welcome page containing features overview, beautiful animations, and CTA buttons.
  - `Login.jsx` & `Signup.jsx`: Multi-functional entry forms supporting local auth and Google OAuth integration.
  - `Dashboard.jsx`: Central routing point that automatically redirects the user to their respective homepage based on their role.
  - `StudentCourses.jsx` & `StudentCourseDetail.jsx`: Allows students to enroll in new courses using invite codes, view PDF study guides and video lectures, take interactive quizzes, generate AI study notes, and submit homework files.
  - `TeacherCourses.jsx` & `TeacherCourseDetail.jsx`: Allows teachers to create new courses, upload educational media to Cloudinary, configure assignments, build quizzes, and generate invite codes.
  - `AssignmentSubmissions.jsx` & `QuizSubmissions.jsx`: Displays tables of uploads, grades, scores, and review status.
  - `SubmissionReview.jsx`: The grading page showing the student's submission side-by-side with Groq's automated AI feedback suggestions.
  - `AdminApprovals.jsx` & `AdminUsers.jsx`: Interface for administrators to view and manage platform users, and approve or reject pending teacher applications.
  - `Analytics.jsx`: Renders premium, interactive visualization charts (bar graphs, area charts, and donut charts) using **Recharts**.
  - `TeacherPending.jsx`: Static page showing a notification screen for teachers waiting for admin validation.
  - `Unauthorized.jsx`: Access denied screen.

---

### ⚙️ Server (Backend) Architecture
The backend application is built using Node.js and Express. It connects to MongoDB Atlas using Mongoose and handles background tasks like Cloudinary file uploads and Groq AI calls.

- **`server/index.js`**: Core entry point. Loads configuration values from `.env`, initializes the database connection, binds global middlewares (CORS, Express JSON, morgan logger), boots Socket.io, binds REST endpoints, and opens the listener port.
- **`server/config/`**:
  - `db.js`: Establishes the connection to MongoDB and seeds the initial administrator account securely using credentials loaded from `.env`.
  - `socket.js`: Houses the WebSocket initialization logic, managing real-time events and user maps.
  - `cloudinary.js`: Configures storage middleware (Multer storage) for direct-to-cloud PDF/video file uploads.
- **`server/models/`**:
  - `User.js`: Schema representing user attributes. Automatically hashes passwords on creation/modification and exposes a compare-password utility.
  - `Course.js`: Schema tracking course outlines, enrollments, attachments, quizzes, and assignment configurations.
  - `Submission.js`: Schema tracking files submitted, grades, comments, and the AI feedback object.
  - `QuizSubmission.js`: Schema capturing scores and selected choices for quizzes.
  - `Notification.js`: Schema detailing alerts sent, read/unread states, and creation times.
- **`server/middlewares/`**:
  - `authMiddleware.js`: Protects route endpoints, reads the incoming authorization bearer token, and enforces Role-Based Access Control (RBAC).
  - `errorMiddleware.js`: Handles global Express errors and formats 404 router fallbacks.
- **`server/controllers/`**:
  - `authController.js`: Logic for standard registrations, credential logins, and OAuth callbacks.
  - `adminController.js`: Operations to fetch, manage, approve, or reject user registers.
  - `courseController.js`: Manages creating and editing courses, uploading chapters, joining classes, and taking quizzes.
  - `submissionController.js`: Manages homework hand-ins, communicates with the Groq API to parse student materials, compiles structured review recommendations, and updates final grades.
  - `notificationController.js`: Provides read-write notifications endpoints.
  - `analyticsController.js`: Formulates aggregate reports for students, teachers, and admins.
- **`server/utils/`**:
  - `apiResponse.js`: Formulates standardized JSON payloads for response handling.
  - `email.js`: Configures SMTP transport settings using Nodemailer to dispatch confirmation or alert emails.

---


## 🚀 Setup & Installation

### 1. Prerequisites
- **Node.js** (v16+)
- **MongoDB Atlas** database account
- **Cloudinary** account
- **Groq API Key**
- **Google OAuth Client ID & Secret**

### 2. Backend Setup
1. Open a terminal in the `/server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `/server` directory using `/server/.env.example` as a template and populate your credentials.
4. Start the backend server:
   ```bash
   npm run dev
   ```
   *(Note: The server will automatically connect to MongoDB and seed the administrator account from your `.env` values)*

### 3. Frontend Setup
1. Open a terminal in the `/client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Populate `/client/.env` with your frontend configuration (Vite base URL, Google client ID).
4. Run the Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`.