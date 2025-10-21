import type { Metadata } from "next";
import { Red_Hat_Display } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

import { Toaster } from "sonner";

import '@stream-io/video-react-sdk/dist/css/styles.css';
import 'react-datepicker/dist/react-datepicker.css';

const redHatDisplay = Red_Hat_Display({
  subsets: ["latin"],
  display: 'swap',
  // Available weights: 300,400,500,600,700,800,900
  weight: ['400', '500', '700'], // Specify the weights you need
  variable: '--font-red-hat-display' // Optional CSS variable
});

export const metadata: Metadata = {
  title: "brAInstorm",
  description: "Video chat with an AI assistant",
  icons: '/icons/newlogo.png',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ClerkProvider
      appearance={{
        layout: {
          logoImageUrl: '/icons/newlogo.png',
          socialButtonsVariant: 'iconButton',
        },
        variables: {
          colorPrimary: '#2563eb',
          colorText: '#1f2937',
          colorBackground: '#f9fafb',
          colorInputBackground: '#252a41',
          colorInputText: '#ffff',
        }
      }}>
      <body className={`${redHatDisplay.className} bg-cyan-950 font-sans`}>
        {children}
        <Toaster />
      </body>
      </ClerkProvider>
    </html>
  );
}
