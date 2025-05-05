import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import OCIDProvider from "../components/OCIDProvider";
import Providers from "../components/Providers";
import { Analytics } from "@vercel/analytics/react";
import Clarity from '@microsoft/clarity';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sufle | Education Partner",
  description: "A unique education path generator for learners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clarityApiKey = process.env.CLARITY_API_KEY;
  if (clarityApiKey) {
    Clarity.init(clarityApiKey);
  }

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} light `}>
        <Providers>
          <OCIDProvider>{children}</OCIDProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
