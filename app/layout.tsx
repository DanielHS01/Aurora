import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";
import { clashDisplay } from "./lib/fonts";
import Preloader from "@/components/Preloader";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={clashDisplay.variable}>
      <body>
        <Preloader />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}