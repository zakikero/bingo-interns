import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

export const metadata = {
  title: "Fika Bingo",
  description: "Fika Bingo Event",
  icons: {
    icon: "/assets/fika-cake1.png",
    apple: "/assets/fika-cake1.png",
    shortcut: "/assets/fika-cake1.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/assets/fika-cake1.png" />
        <link rel="shortcut icon" href="/assets/fika-cake1.png" />
        <link rel="apple-touch-icon" href="/assets/fika-cake1.png" />
      </head>
      <body>
        <AuthProvider>
          <ErrorBoundary>
            <main className="app-shell">
              <div className="blob blob-top-left" />
              <div className="blob blob-bottom-right" />
              {children}
            </main>
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
