import type { Metadata } from "next";
import "./globals.css";
import CacheStatus from "@/components/CacheStatus";
import AuthWrapper from "@/components/AuthWrapper";

// Using system fonts for better performance and reliability

export const metadata: Metadata = {
  title: "First Step School - Management System",
  description: "School management system for First Step School, Saurabh Vihar, Jaitpur, Delhi. Manage attendance, fees, and student records.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-apple bg-white">
        <AuthWrapper>
          {children}
        </AuthWrapper>
        <CacheStatus />
      </body>
    </html>
  );
}
