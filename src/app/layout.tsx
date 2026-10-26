import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashboard Kebolehpasaran Graduan Wanita TVET",
  description: "Prototaip analitik penyelidikan akademik graduan wanita TVET Malaysia",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ms">
      <body>{children}</body>
    </html>
  );
}
