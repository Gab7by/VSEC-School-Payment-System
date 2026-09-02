import { forwardRef } from "react";
import { VSEC_SCHOOL } from "../../lib/constants";
import type { Student } from "../../lib/types";

type Props = {
  student: Student;
};

const CARD_WIDTH = 650;
const CARD_HEIGHT = 410;

function EmvChip() {
  return (
    <div
      style={{
        position: "absolute",
        top: 118,
        right: 24,
        width: 52,
        height: 38,
        borderRadius: 7,
        background:
          "linear-gradient(135deg, #f6e2a1 0%, #d9b45c 35%, #a9781f 70%, #8a6015 100%)",
        border: "1px solid rgba(120,90,20,0.6)",
        boxShadow:
          "inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.2)",
        overflow: "hidden",
      }}
    >
      {/* contact-pad grid lines */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          height: 1.5,
          background: "rgba(90,65,10,0.45)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "33%",
          width: 1.2,
          background: "rgba(90,65,10,0.35)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "66%",
          width: 1.2,
          background: "rgba(90,65,10,0.35)",
        }}
      />
      {/* small extra contact pad */}
      <div
        style={{
          position: "absolute",
          left: 4,
          top: 4,
          width: 10,
          height: 7,
          borderRadius: 2,
          background: "rgba(90,65,10,0.25)",
        }}
      />
      {/* diagonal gloss */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(120deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 40%)",
        }}
      />
    </div>
  );
}

function Row({
  label,
  value,
  accentColor,
}: {
  label: string;
  value: string;
  accentColor: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: "#6b7280",
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
        {value || "—"}
      </span>
      <span style={{ height: 2, width: 28, background: accentColor, borderRadius: 1, marginTop: 2 }} />
    </div>
  );
}

const StudentIdCard = forwardRef<HTMLDivElement, Props>(function StudentIdCard(
  { student },
  ref
) {
  const isVsec = student.schoolType === VSEC_SCHOOL;

  const theme = isVsec
    ? {
        gradient: "linear-gradient(135deg, #0B3D91 0%, #0B3D91 62%, #D4AF37 100%)",
        nameColor: "#0B3D91",
        accent: "#D4AF37",
        accentDark: "#b8941e",
        schoolName: "VSEC COLLEGE OF STUDIES",
      }
    : {
        gradient: "linear-gradient(135deg, #0f766e 0%, #0f766e 62%, #2dd4bf 100%)",
        nameColor: "#0f766e",
        accent: "#2dd4bf",
        accentDark: "#0f766e",
        schoolName: "DONKOR KIDS TALENT INTERNATIONAL SCHOOL",
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
          right: -60,
          bottom: -60,
          width: 300,
          height: 300,
          opacity: 0.06,
          objectFit: "contain",
        }}
      />

      <EmvChip />

      {/* Header band */}
      <div
        style={{
          position: "relative",
          height: 112,
          background: theme.gradient,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 24px",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          }}
        >
          <img
            src="/vsec-logo.png"
            alt="School logo"
            style={{ width: 46, height: 46, objectFit: "contain" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: 0.5,
              color: "#ffffff",
              lineHeight: 1.2,
            }}
          >
            {theme.schoolName}
          </span>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            Student Identification Card
          </span>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          position: "relative",
          padding: "0 24px",
          height: CARD_HEIGHT - 112 - 6,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: isVsec ? 22 : 32,
        }}
      >
        <div>
          {!isVsec && (
            <span
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "#6b7280",
                marginBottom: 4,
              }}
            >
              Student
            </span>
          )}
          <div
            style={{
              fontSize: 23,
              fontWeight: 800,
              color: theme.nameColor,
              lineHeight: 1.2,
            }}
          >
            {student.fullName}
          </div>
          <span
            style={{
              display: "block",
              height: 3,
              width: 46,
              background: theme.accent,
              borderRadius: 2,
              marginTop: 6,
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <Row label="Student ID" value={student.studentId} accentColor={theme.accent} />
          <Row label="Class Level" value={student.classLevel} accentColor={theme.accent} />
          {isVsec ? (
            <>
              <Row label="Campus" value={student.campus ?? ""} accentColor={theme.accent} />
              <Row label="Nationality" value={student.nationalityGroup ?? ""} accentColor={theme.accent} />
            </>
          ) : (
            <Row label="Student Type" value={student.studentType ?? ""} accentColor={theme.accent} />
          )}
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

export default StudentIdCard;
export { CARD_WIDTH, CARD_HEIGHT };
