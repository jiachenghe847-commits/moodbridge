import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/chat", label: "聊天" },
  { href: "/mood", label: "心情记录" },
  { href: "/screeners", label: "自评问卷" },
  { href: "/privacy", label: "隐私与免责声明" },
];

export const metadata: Metadata = {
  title: "Moodbridge 心桥",
  description: "中文 AI 情绪陪伴与心理风险提示助手",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="border-b border-stone-200 bg-white/90">
          <nav className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="text-lg font-semibold text-stone-950">
              Moodbridge 心桥
            </Link>
            <div className="flex flex-wrap gap-2 text-sm text-stone-700">
              {navItems.map((item) => (
                <Link
                  className="rounded-md px-3 py-2 transition hover:bg-stone-100 hover:text-stone-950"
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        <main className="mx-auto min-h-[calc(100vh-73px)] max-w-5xl px-5 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
