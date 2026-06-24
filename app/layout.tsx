import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepoScope — AI GitHub Portfolio Review",
  description:
    "Analyze public GitHub repositories and get concise AI-powered project assessments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
