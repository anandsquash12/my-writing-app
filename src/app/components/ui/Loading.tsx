"use client";

interface SkeletonBlockProps {
  className?: string;
}

export function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
  return <div className={`animate-pulse rounded-2xl bg-neutral-200/80 ${className}`.trim()} aria-hidden="true" />;
}

export function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-40" />
              <SkeletonBlock className="h-3 w-28" />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <SkeletonBlock className="h-5 w-2/3" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <SkeletonBlock className="h-56 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileShimmer() {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SkeletonBlock className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <SkeletonBlock className="h-7 w-48" />
            <SkeletonBlock className="h-4 w-72 max-w-full" />
            <div className="grid grid-cols-3 gap-3">
              <SkeletonBlock className="h-16 w-full" />
              <SkeletonBlock className="h-16 w-full" />
              <SkeletonBlock className="h-16 w-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <SkeletonBlock className="h-64 w-full" />
      </div>
    </div>
  );
}

export function ButtonSpinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />;
}
