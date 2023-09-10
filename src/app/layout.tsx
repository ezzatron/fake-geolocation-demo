import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fake Geolocation Demo",
  description: "Demonstrates the features of the fake-geolocation package",
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
