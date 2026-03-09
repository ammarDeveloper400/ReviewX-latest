import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Login from '@/pages/Login';
import AdminDashboard from '@/pages/AdminDashboard';
import EmployeesPage from '@/pages/EmployeesPage';
import InternalReviewsPage from '@/pages/InternalReviewsPage';
import CreateInternalReviewPage from '@/pages/CreateInternalReviewPage';
import CreateMonthlyFinalPage from '@/pages/CreateMonthlyFinalPage';
import CategoryManagementPage from '@/pages/CategoryManagementPage';
import BonusBracketManagementPage from '@/pages/BonusBracketManagementPage';
import SalaryPayablePage from '@/pages/SalaryPayablePage';
import EmployeeProfilePage from '@/pages/EmployeeProfilePage';
import EmployeePortal from '@/pages/EmployeePortal';
import PMDashboard from '@/pages/PMDashboard';
import PMMyReviewsPage from '@/pages/PMMyReviewsPage';
import AdminManagementPage from '@/pages/AdminManagementPage';
import ReviewDetailPage from '@/pages/ReviewDetailPage';
import InternalReviewDetailPage from '@/pages/InternalReviewDetailPage';
import UsersManagementPage from '@/pages/UsersManagementPage';
import AuditLogsPage from '@/pages/AuditLogsPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import '@/App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/employees" element={<ProtectedRoute allowedRoles={['Admin']}><EmployeesPage /></ProtectedRoute>} />
          <Route path="/admin/employees/:employeeId" element={<ProtectedRoute allowedRoles={['Admin', 'PM']}><EmployeeProfilePage /></ProtectedRoute>} />
          
          {/* Internal Reviews Routes */}
          <Route path="/admin/internal-reviews" element={<ProtectedRoute allowedRoles={['Admin', 'PM']}><InternalReviewsPage /></ProtectedRoute>} />
          <Route path="/admin/internal-reviews/create" element={<ProtectedRoute allowedRoles={['Admin', 'PM']}><CreateInternalReviewPage /></ProtectedRoute>} />
          <Route path="/admin/internal-reviews/:reviewId/edit" element={<ProtectedRoute allowedRoles={['Admin', 'PM']}><CreateInternalReviewPage /></ProtectedRoute>} />
          
          {/* Monthly Final Routes */}
          <Route path="/admin/monthly-finals/create" element={<ProtectedRoute allowedRoles={['Admin', 'PM']}><CreateMonthlyFinalPage /></ProtectedRoute>} />
          <Route path="/admin/monthly-finals/:finalId/edit" element={<ProtectedRoute allowedRoles={['Admin', 'PM']}><CreateMonthlyFinalPage /></ProtectedRoute>} />
          
          {/* Settings Routes */}
          <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['Admin']}><CategoryManagementPage /></ProtectedRoute>} />
          <Route path="/admin/bonus-brackets" element={<ProtectedRoute allowedRoles={['Admin']}><BonusBracketManagementPage /></ProtectedRoute>} />
          <Route path="/admin/salary-payable" element={<ProtectedRoute allowedRoles={['Admin']}><SalaryPayablePage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['Admin']}><UsersManagementPage /></ProtectedRoute>} />
          <Route path="/admin/admin-management" element={<ProtectedRoute allowedRoles={['Admin']}><AdminManagementPage /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['Admin']}><AuditLogsPage /></ProtectedRoute>} />
          
          {/* Review Detail Routes - accessible by Admin and PM only for internal */}
          <Route path="/reviews/:reviewId" element={<ProtectedRoute allowedRoles={['Admin', 'PM', 'Employee']}><ReviewDetailPage /></ProtectedRoute>} />
          <Route path="/internal-reviews/:reviewId" element={<ProtectedRoute allowedRoles={['Admin', 'PM']}><InternalReviewDetailPage /></ProtectedRoute>} />
          
          {/* PM Routes */}
          <Route path="/pm" element={<ProtectedRoute allowedRoles={['PM']}><PMDashboard /></ProtectedRoute>} />
          <Route path="/pm/my-reviews" element={<ProtectedRoute allowedRoles={['PM']}><PMMyReviewsPage /></ProtectedRoute>} />
          
          {/* Employee Routes */}
          <Route path="/employee" element={<ProtectedRoute allowedRoles={['Employee']}><EmployeePortal /></ProtectedRoute>} />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
