import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Drop Safely — Student Transport Pick & Drop Service",
  description:
    "Reliable pick & drop service designed exclusively for university and college students. Book your seat, track your bus live, and arrive stress-free.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
