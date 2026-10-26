export const metadata = {
  title: "Vider Enjoy",
  description: "AI chat application scaffold",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
