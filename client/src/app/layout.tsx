import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CampusGrid — Smart Campus Platform",
  description:
    "CampusGrid is a smart campus platform — centralized academic resources, career opportunities, peer networking, real-time chat, and administrative tools for your college.",
  keywords: ["campus", "college", "students", "notes", "peer matching"],
  authors: [{ name: "CampusGrid Team" }],
  openGraph: {
    title: "CampusGrid — Smart Campus Platform",
    description: "Smart campus management platform",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#FFFFFF",
                color: "#0F172A",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontFamily: "Inter, sans-serif",
                boxShadow: "0 4px 12px rgba(15,23,42,0.1)",
              },
              success: { iconTheme: { primary: "#16A34A", secondary: "#F0FDF4" } },
              error:   { iconTheme: { primary: "#DC2626", secondary: "#FEF2F2" } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
