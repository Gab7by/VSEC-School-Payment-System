import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { db } from "../lib/db";
import { hashPassword } from "../lib/utils";
import type { Session } from "../lib/types";

const SESSION_KEY = "vsec_session";

type LoginResult = { success: boolean; error?: string };

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  refreshSession: (updates: Partial<Session>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setSession(JSON.parse(raw) as Session);
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const hash = await hashPassword(password);

    // Check admins first
    const adminResult = await db.queryOnce({
      admins: { $: { where: { email: normalizedEmail } } },
    });
    const admin = adminResult.data.admins?.[0];
    if (admin && admin.passwordHash === hash) {
      const s: Session = {
        id: admin.id,
        role: "admin",
        name: admin.name,
        email: admin.email,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      setSession(s);
      return { success: true };
    }

    // Check students
    const studentResult = await db.queryOnce({
      students: { $: { where: { email: normalizedEmail } } },
    });
    const student = studentResult.data.students?.[0];
    if (student && student.passwordHash === hash) {
      const s: Session = {
        id: student.id,
        role: "student",
        name: student.fullName,
        email: student.email,
        studentId: student.studentId,
        schoolType: student.schoolType,
        classLevel: student.classLevel,
        campus: student.campus,
        studyMode: student.studyMode,
        nationalityGroup: student.nationalityGroup,
        isFirstLogin: student.isFirstLogin,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      setSession(s);
      return { success: true };
    }

    return { success: false, error: "Invalid email or password." };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }

  function refreshSession(updates: Partial<Session>) {
    setSession((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  return (
    <AuthContext.Provider
      value={{ session, isLoading, login, logout, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
