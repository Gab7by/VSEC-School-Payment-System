import { useState } from "react";
import { db } from "./lib/db";
import { useAuth } from "./context/AuthContext";
import SetupPage from "./pages/SetupPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AdminLayout from "./pages/AdminLayout";
import StudentLayout from "./pages/StudentLayout";

export type AdminSection = "dashboard" | "students" | "fees" | "payments";
export type StudentSection = "home" | "payments" | "history" | "profile";
type TopPage = "login" | "forgot-password";

function App() {
  const { session, isLoading: authLoading } = useAuth();
  const [topPage, setTopPage] = useState<TopPage>("login");
  const [adminSection, setAdminSection] = useState<AdminSection>("dashboard");
  const [studentSection, setStudentSection] = useState<StudentSection>("home");

  const { data: adminData, isLoading: adminsLoading } = db.useQuery({
    admins: {},
  });

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

  // No session — show auth pages
  if (!session) {
    // First-time setup: no admins exist yet
    if (adminData?.admins?.length === 0) {
      return <SetupPage />;
    }

    if (topPage === "forgot-password") {
      return (
        <ForgotPasswordPage onBack={() => setTopPage("login")} />
      );
    }

    return (
      <LoginPage onForgotPassword={() => setTopPage("forgot-password")} />
    );
  }

  // Authenticated — show the correct portal
  if (session.role === "admin") {
    return (
      <AdminLayout
        currentSection={adminSection}
        onNavigate={(section: AdminSection) => setAdminSection(section)}
      />
    );
  }

  return (
    <StudentLayout
      currentSection={studentSection}
      onNavigate={(section: StudentSection) => setStudentSection(section)}
    />
  );
}

export default App;
