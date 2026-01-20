import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/layout/Header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DocOps Copilot - AI-Powered Document Intelligence",
  description: "Transform unstructured documents into actionable intelligence with AI-powered analysis, intelligent routing, and workflow automation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50 min-h-screen`}>
        <Providers>
          <Header />
          <main className="container py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
