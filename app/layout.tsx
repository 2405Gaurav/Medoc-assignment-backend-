import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "MedflowX - OPD Token Allocation",
  description: "Hospital OPD Token Allocation System with Elastic Capacity Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
