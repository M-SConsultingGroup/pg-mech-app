import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import Header from '@/components/Headers';
import { AuthProvider } from '@/context/AuthContext';
import GoogleMapsLoader from '@/components/GoogleMapsLoader';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "PG Mechanical App",
  description: "Generated by create next app",
};

export default function RootLayout({ children }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Toaster />
        <AuthProvider>
          <Header />
          <GoogleMapsLoader>
            {children}
          </GoogleMapsLoader>
        </AuthProvider>
      </body>
    </html>
  );
}