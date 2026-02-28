import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "4-Page Comic Generator",
  description: "Generate cohesive 4-page comics from one prompt.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
