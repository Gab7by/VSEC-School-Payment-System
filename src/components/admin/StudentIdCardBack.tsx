import { forwardRef } from "react";
import { VSEC_SCHOOL } from "../../lib/constants";
import type { Student } from "../../lib/types";
import { CARD_WIDTH, CARD_HEIGHT } from "./StudentIdCard";

type Props = {
  student: Student;
};

function InfoRow({
  label,
  value,
  accentColor,
}: {
  label: string;
  value: string;
  accentColor: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <span
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: "#6b7280",
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>
        {value}
      </span>
      <span style={{ height: 1.5, width: 22, background: accentColor, borderRadius: 1, marginTop: 1 }} />
    </div>
  );
}

const StudentIdCardBack = forwardRef<HTMLDivElement, Props>(function StudentIdCardBack(
  { student },
  ref
) {
  const isVsec = student.schoolType === VSEC_SCHOOL;

  const theme = isVsec
    ? {
        accent: "#D4AF37",
        accentDark: "#b8941e",
        noticeTint: "rgba(212,175,55,0.1)",
        notice:
          "This card belongs to VSEC College of Studies. If found, return to VSEC College of Studies main office at Kumasi (Anloga Junction) or call +233 541 623 059.",
        rows: [
          { label: "Website", value: "vseccollege.com" },
          { label: "Contact", value: "+233 541 623 059" },
          { label: "Offices", value: "Kumasi (Anloga Junction) and Accra (Osu)" },
        ],
      }
    : {
        accent: "#2dd4bf",
        accentDark: "#0f766e",
        noticeTint: "rgba(15,118,110,0.08)",
        notice:
          "This card belongs to Donkor Kids Talent International School. If found, return to Donkor Kids Talent International School main office at Kumasi (Appiedu) or call +233 541 623 059.",
        rows: [
          { label: "Contact", value: "+233 541 623 059" },
          { label: "Office", value: "Kumasi (Appiedu)" },
        ],
      };

  return (
    <div
      ref={ref}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 18,
        overflow: "hidden",
        position: "relative",
        background: "#ffffff",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {/* Watermark */}
      <img
        src="/vsec-logo.png"
        alt=""
        style={{
          position: "absolute",
          left: -60,
          bottom: -60,
          width: 260,
          height: 260,
          opacity: 0.05,
          objectFit: "contain",
        }}
      />

      {/* Magnetic stripe */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 20,
          height: 56,
          background: "linear-gradient(180deg, #2b2b2b 0%, #0a0a0a 100%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          marginTop: 20 + 56,
          height: CARD_HEIGHT - 20 - 56 - 6,
          padding: "16px 24px 0 24px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Logo + Student ID */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
            }}
          >
            <img
              src="/vsec-logo.png"
              alt="School logo"
              style={{ width: 28, height: 28, objectFit: "contain" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "#6b7280",
              }}
            >
              Student ID
            </span>
            <span style={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>
              {student.studentId}
            </span>
          </div>
        </div>

        {/* Notice box */}
        <div
          style={{
            position: "relative",
            background: theme.noticeTint,
            borderRadius: 10,
            padding: "10px 14px 10px 16px",
            borderLeft: `3px solid ${theme.accentDark}`,
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: theme.accentDark,
              marginBottom: 3,
            }}
          >
            If Found
          </span>
          <p style={{ margin: 0, fontSize: 10.5, lineHeight: 1.45, color: "#374151", fontWeight: 500 }}>
            {theme.notice}
          </p>
        </div>

        {/* Contact info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {theme.rows.map((r) => (
            <InfoRow key={r.label} label={r.label} value={r.value} accentColor={theme.accent} />
          ))}
        </div>
      </div>

      {/* Footer accent */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 6,
          background: `linear-gradient(90deg, ${theme.accentDark}, ${theme.accent})`,
        }}
      />
    </div>
  );
});

export default StudentIdCardBack;
