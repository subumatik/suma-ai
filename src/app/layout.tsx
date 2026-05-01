import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import Providers from "./providers";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Demodex AI - Akilli Dermatoloji Asistani",
  description:
    "Yapay zeka destekli Demodex analizi ve dermatoloji asistani. Gercek zamanli goruntu analizi ve uzman onerileri.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.variable}>
        <AppRouterCacheProvider>
          <Providers>
            <AuthProvider>{children}</AuthProvider>
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
