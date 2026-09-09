import Link from "next/link";

import { Mascot } from "@/components/ui/Mascot";
import { BRAND } from "@/lib/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-6 pb-10 pt-10">
      <Link href="/" className="mb-6 flex items-center gap-3 self-start">
        <Mascot size={44} />
        <span className="text-xl font-extrabold tracking-tight text-charcoal-900">
          {BRAND.name}
        </span>
      </Link>
      {children}
    </div>
  );
}
