import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EFP - Evacuation Floor Planner",
  description: "Build evacuation floor plans with walls, doors, stairs, exits, and safety symbols.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
