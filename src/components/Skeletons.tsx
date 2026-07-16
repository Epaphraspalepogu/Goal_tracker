import { cn } from '@/lib/utils';

export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-lg', className)} />;
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <div className="flex justify-between">
        <LoadingSkeleton className="h-4 w-24" />
        <LoadingSkeleton className="size-11 rounded-xl" />
      </div>
      <LoadingSkeleton className="h-8 w-16" />
    </div>
  );
}

export function GoalListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-4 flex items-center gap-4">
          <LoadingSkeleton className="size-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton className="h-4 w-1/3" />
            <LoadingSkeleton className="h-3 w-1/2" />
          </div>
          <LoadingSkeleton className="size-8 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
