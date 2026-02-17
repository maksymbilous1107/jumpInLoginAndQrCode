import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JumpIn QR Check-In",
  description:
    "Registrati e scansiona il QR Code per il check-in agli eventi JumpIn.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-inter mesh-bg min-h-screen">{children}</body>
    </html>
  );
}
