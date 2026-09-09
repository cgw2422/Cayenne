import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#D92D20,#F15A24)",
          color: "#FFF7E8",
          fontSize: 40,
          fontWeight: 900,
        }}
      >
        C
      </div>
    ),
    size,
  );
}
