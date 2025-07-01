import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} bg-gradient-to-br from-gray-900 to-blue-900`}>
        {children}
      </body>
    </html>
  );
}
