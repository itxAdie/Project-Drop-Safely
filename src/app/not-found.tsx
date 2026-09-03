import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center">
      <div className="glass-card glow-green max-w-md p-10">
        <h1 className="mb-2 font-display text-7xl font-extrabold text-[#22c55e]">404</h1>
        <p className="mb-2 font-display text-xl font-semibold text-[#f5f5f5]">Page Not Found</p>
        <p className="mb-8 font-body text-sm leading-relaxed text-[#f5f5f5]/60">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-[#22c55e] px-8 py-3 font-display text-sm font-semibold text-[#0a0a0a] transition-all hover:bg-[#16a34a] hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
