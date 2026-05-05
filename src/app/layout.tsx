import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import Providers from "./providers";
import AuthProvider from "@/components/AuthProvider";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Avukatip - Avukatip Platformu",
  description:
    "Avukatip ile avukatınızdan randevu alın, dava dosyalarınızı takip edin ve avukatınızla güvenli mesajlaşın.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={montserrat.variable} style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>
        <InitColorSchemeScript attribute="class" />
        <AppRouterCacheProvider>
          <Providers>
            <AuthProvider>{children}</AuthProvider>
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
