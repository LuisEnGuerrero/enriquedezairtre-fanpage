import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css"
import { Toaster } from "@/components/ui/toaster";
import AuthProvider from "@/components/providers/AuthProvider";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Enrique de Zairtre â€” FanPage Oficial",
  description: "FanPage oficial de Enrique de Zairtre (Enrique Guerrero). Reproductor integrado, gestiÃ³n de favoritos y creaciÃ³n de listas de reproducciÃ³n. MÃºsica: metal de fusiÃ³n Ã©pica; Ã¡lbum conceptual Â«VÃ³rticeÂ».",
  keywords: [
    "Enrique de Zairtre",
    "Enrique Guerrero",
    "FanPage",
    "mÃºsica",
    "reproductor",
    "listas de reproducciÃ³n",
    "favoritos",
    "metal de fusiÃ³n",
    "VÃ³rtice"
  ],
  authors: [{ name: "Luis Enrique Guerrero" }],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.svg",    
  },
  openGraph: {
    title: "Enrique de Zairtre â€” FanPage Oficial",
    description: "Sitio oficial de Enrique de Zairtre: escucha su mÃºsica, organiza favoritos y crea listas de reproducciÃ³n personalizadas. Ãlbum destacado: Â«VÃ³rticeÂ».",
    url: "https://zairtre-fanpage.onreder.com",
    siteName: "Enrique de Zairtre",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Enrique de Zairtre â€” FanPage"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Enrique de Zairtre â€” FanPage Oficial",
    description: "Escucha a la Banda Zairtre, crea playlists y organiza tus favoritos en su FanPage oficial.",
    images: ["/og-image.png"]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

