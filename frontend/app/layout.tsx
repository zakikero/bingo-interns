import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

export const metadata = {
  title: "Fika Bingo",
  description: "Fika Bingo Event",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
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
