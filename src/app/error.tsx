"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center">
      <div className="glass-card glow-green max-w-md p-10">
        <div className="mb-6 text-5xl">⚠️</div>
        <h1 className="mb-3 font-display text-2xl font-bold text-[#f5f5f5]">
          Something went wrong
        </h1>
        <p className="mb-8 font-body text-sm leading-relaxed text-[#f5f5f5]/60">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={reset}
          className="rounded-xl bg-[#22c55e] px-8 py-3 font-display text-sm font-semibold text-[#0a0a0a] transition-all hover:bg-[#16a34a] hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
