import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SWRProvider } from "@/components/providers/SWRProvider";
import { ToastProvider } from "@/components/ui/Toast";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Drop Safely — Student Transport Pick & Drop Service",
  description:
    "Reliable pick & drop service designed exclusively for university and college students. Book your seat, track your bus live, and arrive stress-free.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} antialiased`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SWRProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
