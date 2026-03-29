import Link from "next/link";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/30 p-6 sm:p-8">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-400 dark:text-white/25">
            Grovy Account
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="text-sm text-gray-600 dark:text-white/50">{subtitle}</p>
        </div>

        <div className="mt-6 sm:mt-8">{children}</div>

        {footer ? (
          <div className="mt-6 pt-5 border-t border-black/5 dark:border-white/10 text-sm text-gray-600 dark:text-white/50">
            {footer}
          </div>
        ) : null}
      </div>

      <div className="text-center mt-5">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 hover:text-gray-800 dark:text-white/45 dark:hover:text-white/75"
        >
          Back To Home
        </Link>
      </div>
    </div>
  );
}
