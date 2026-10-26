export const metadata = {
  title: "Vider(enjoy)",
  description: "AI coding assistant and code intelligence engine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
