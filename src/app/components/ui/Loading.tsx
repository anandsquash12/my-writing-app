"use client";

interface SkeletonBlockProps {
  className?: string;
}

export function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
  return <div className={`animate-pulse rounded-2xl bg-white/8 ${className}`.trim()} aria-hidden="true" />;
}

export function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-[28px] border border-white/10 bg-[#121218]/90 p-5 shadow-xl">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-11 w-11 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-40" />
              <SkeletonBlock className="h-3 w-28" />
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <SkeletonBlock className="h-7 w-2/3" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <SkeletonBlock className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function VaultSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-[28px] border border-white/10 bg-[#121218]/90 p-5 shadow-xl">
          <SkeletonBlock className="h-40 w-full" />
          <SkeletonBlock className="mt-5 h-4 w-24" />
          <SkeletonBlock className="mt-3 h-8 w-2/3" />
          <SkeletonBlock className="mt-3 h-4 w-full" />
          <SkeletonBlock className="mt-2 h-4 w-5/6" />
          <div className="mt-5 flex items-center justify-between">
            <SkeletonBlock className="h-7 w-24" />
            <SkeletonBlock className="h-11 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileShimmer() {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#121218]/90 p-6 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SkeletonBlock className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <SkeletonBlock className="h-8 w-48" />
            <SkeletonBlock className="h-4 w-72 max-w-full" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#121218]/90 p-6 shadow-xl">
        <SkeletonBlock className="h-72 w-full" />
      </div>
    </div>
  );
}

export function ButtonSpinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />;
}
