import type { Metadata } from "next";
import { Instrument_Serif, DM_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/ui/Header";
import HeaderConditional from "@/components/ui/HeaderConditional";
import AuthProvider from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/ui/ThemeContext";

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "QuickyNotes - Turn your notes into knowledge, fast",
  description: "Upload your lecture notes and let AI generate summaries, flashcards, and practice exams in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSerif.variable} ${dmSans.variable} antialiased`}
      >
        <AuthProvider>
          <ThemeProvider>
            <HeaderConditional>
              <Header />
            </HeaderConditional>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
