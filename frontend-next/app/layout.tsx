import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Script from "next/script";


const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexus | The Intelligent Business Archive",
  description: "넥서스(Nexus)는 창업과 비즈니스 성장을 돕는 지능형 브랜딩 및 상권 분석 플랫폼입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${manrope.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        {/* 가장 안정적인 Toss Payments v1 Core SDK */}
        <Script 
          src="https://js.tosspayments.com/v1" 
          strategy="beforeInteractive" 
        />
      </head>
      <body className="h-screen flex flex-col font-inter bg-[var(--nexus-bg)] text-[var(--nexus-on-bg)]">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
