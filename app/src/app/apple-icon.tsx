import { ImageResponse } from "next/og";

// Ícono para iOS — borde con padding y fondo opaco para "Add to Home Screen".
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #ea580c 0%, #c2410c 60%, #7c2d12 100%)",
          color: "#fff7ed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 96,
          fontWeight: 800,
          letterSpacing: "-0.05em",
          fontFamily: "system-ui",
        }}
      >
        MV
      </div>
    ),
    size,
  );
}
