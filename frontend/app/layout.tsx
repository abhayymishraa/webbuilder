import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ember/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  ),
  title: "WEB BUILDER AI",
  description: "Build React applications with AI",
  icons: {
    icon: { url: "/brand/webbuilder-mark.svg", type: "image/svg+xml" },
  },
  openGraph: {
    title: "WEB BUILDER AI ",
    description:
      "Build applications faster with AI-powered code generation and intelligent development assistance.",
    images: [
      {
        url: "/brand/webbuilder-social.png",
        width: 1774,
        height: 887,
        alt: "WebBuilder: orange building-block mark and wordmark",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WEB BUILDER AI",
    description:
      "Build applications faster with AI-powered code generation and intelligent development assistance.",
    images: ["/brand/webbuilder-social.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className="font-sans antialiased">
        <ThemeProvider>{children}<Toaster /></ThemeProvider>
      </body>
    </html>
  );
}
