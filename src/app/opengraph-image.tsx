import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const alt = "StayRank — rank where to stay, together";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Embed the real logo as a data URI so it renders inside the OG card.
const logo = readFileSync(
  join(process.cwd(), "public/brand/logo-horizontal.png"),
).toString("base64");
const logoSrc = `data:image/png;base64,${logo}`;

export default function OpengraphImage() {
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
          gap: 36,
          background:
            "radial-gradient(120% 80% at 50% 0%, #d6efff 0%, #eaf6ff 45%, #f6fbff 80%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="StayRank" width={620} height={179} />
        <div
          style={{
            fontSize: 40,
            fontWeight: 600,
            color: "#14233a",
            maxWidth: 900,
            textAlign: "center",
            lineHeight: 1.25,
          }}
        >
          Rank where to stay, together.
        </div>
        <div style={{ fontSize: 28, color: "#5b6b80" }}>
          Everyone&apos;s top 3, with notes, into one leaderboard.
        </div>
      </div>
    ),
    { ...size },
  );
}
