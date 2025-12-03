import AppContext from "@/app/context";
import "antd/dist/reset.css";

import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";

export const metadata: Metadata = {
  title: "XOXO - Hệ thống ERP",
  description:
    "Hệ thống quản lý doanh nghiệp toàn diện dành cho dịch vụ sửa chữa ",
  icons: {
    icon: "/favicon.ico",
  },
};

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const viewport: Viewport = {
  colorScheme: "normal",
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#F9F9F9",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#1f1d24",
    },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <html
      lang="vi"
      className="text-[12px] md:text-[14px] lg:text-[16px]"
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${playfair.variable}`} id="root">
        <AppContext>{children}</AppContext>
      </body>
    </html>
  );
};

export default RootLayout;
