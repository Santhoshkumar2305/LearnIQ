import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Unauthorized from './pages/Unauthorized';
import TeacherPending from './pages/TeacherPending';

// Import newly implemented pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminApprovals from './pages/AdminApprovals';
import AdminUsers from './pages/AdminUsers';
import TeacherCourses from './pages/TeacherCourses';
import TeacherCourseDetail from './pages/TeacherCourseDetail';
import StudentCourses from './pages/StudentCourses';
import StudentCourseDetail from './pages/StudentCourseDetail';
import AssignmentSubmissions from './pages/AssignmentSubmissions';
import SubmissionReview from './pages/SubmissionReview';
import QuizSubmissions from './pages/QuizSubmissions';
import Analytics from './pages/Analytics';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/teacher-pending" element={<TeacherPending />} />

        {/* Private Routes (Protected) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            
            {/* Admin Specific Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/approvals" element={<AdminApprovals />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>

            {/* Teacher Specific Routes */}
            <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
              <Route path="/teacher/courses" element={<TeacherCourses />} />
              <Route path="/teacher/courses/:id" element={<TeacherCourseDetail />} />
              <Route path="/teacher/courses/:id/assignments/:assignmentId/submissions" element={<AssignmentSubmissions />} />
              <Route path="/teacher/courses/:id/quizzes/:quizId/submissions" element={<QuizSubmissions />} />
              <Route path="/teacher/submissions/:submissionId/review" element={<SubmissionReview />} />
            </Route>

            {/* Student Specific Routes */}
            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/student/courses" element={<StudentCourses />} />
              <Route path="/student/courses/:id" element={<StudentCourseDetail />} />
            </Route>
          </Route>
        </Route>

        {/* Catch All Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
