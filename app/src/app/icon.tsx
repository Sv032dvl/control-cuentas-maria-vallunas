import { ImageResponse } from "next/og";

// Ícono dinámico generado en el build. Se sirve en /icon.png
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 260,
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
