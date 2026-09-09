import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFF7E8",
          color: "#D92D20",
          fontSize: 104,
          fontWeight: 900,
        }}
      >
        🌶️
      </div>
    ),
    size,
  );
}
