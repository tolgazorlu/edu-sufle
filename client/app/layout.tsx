import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import OCIDProvider from "../components/OCIDProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "EduKit 🔥 | Starter Kit 💻",
  description:
    "A starter kit for building (Dapps) on the Open Campus L3 (EduChain), powered by create-edu-dapp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <OCIDProvider>{children}</OCIDProvider>
      </body>
    </html>
  );
}
