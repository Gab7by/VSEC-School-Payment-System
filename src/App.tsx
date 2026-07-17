import { Routes, Route, Navigate } from "react-router-dom";
import { db } from "./lib/db";
import { useAuth } from "./context/AuthContext";
import SetupPage from "./pages/SetupPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AdminLayout from "./pages/AdminLayout";
import StudentLayout from "./pages/StudentLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import StudentsPage from "./pages/admin/StudentsPage";
import FeesPage from "./pages/admin/FeesPage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import BulkSmsPage from "./pages/admin/BulkSmsPage";
import HomePage from "./pages/student/HomePage";
import StudentPaymentsPage from "./pages/student/PaymentsPage";
import HistoryPage from "./pages/student/HistoryPage";
import ProfilePage from "./pages/student/ProfilePage";

function App() {
  const { session, isLoading: authLoading } = useAuth();
  const { data: adminData, isLoading: adminsLoading } = db.useQuery({ admins: {} });

  if (authLoading || adminsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    const noAdmins = (adminData?.admins?.length ?? 0) === 0;
    return (
      <Routes>
        {noAdmins && <Route path="/setup" element={<SetupPage />} />}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to={noAdmins ? "/setup" : "/login"} replace />} />
      </Routes>
    );
  }

  if (session.role === "admin") {
    return (
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route path="/admin/students" element={<StudentsPage />} />
          <Route path="/admin/fees" element={<FeesPage />} />
          <Route path="/admin/payments" element={<PaymentsPage />} />
          <Route path="/admin/sms" element={<BulkSmsPage />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<StudentLayout />}>
        <Route path="/student/home" element={<HomePage />} />
        <Route path="/student/payments" element={<StudentPaymentsPage />} />
        <Route path="/student/history" element={<HistoryPage />} />
        <Route path="/student/profile" element={<ProfilePage />} />
        <Route path="/student" element={<Navigate to="/student/home" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/student/home" replace />} />
    </Routes>
  );
}

export default App;
