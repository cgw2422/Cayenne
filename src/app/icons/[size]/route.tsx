import { ImageResponse } from "next/og";

/** Generates the manifest's PNG icons so no binary assets live in the repo. */
export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }, { size: "512-maskable" }];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size: raw } = await params;
  const maskable = raw.endsWith("-maskable");
  const px = Number.parseInt(raw, 10);
  if (!Number.isFinite(px) || px < 16 || px > 1024) {
    return new Response("Not found", { status: 404 });
  }

  // Maskable icons need ~20% safe padding so platforms can crop them.
  const scale = maskable ? 0.58 : 0.78;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#D92D20 0%,#F15A24 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: px * scale,
            height: px * scale,
            borderRadius: px * scale * 0.28,
            background: "#FFF7E8",
            color: "#D92D20",
            fontSize: px * scale * 0.62,
            fontWeight: 900,
            letterSpacing: -2,
          }}
        >
          C
        </div>
      </div>
    ),
    { width: px, height: px },
  );
}
