import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Skeleton component for employee cards during loading
 */
export function EmployeeCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Avatar skeleton */}
            <div className="h-12 w-12 bg-gray-200 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {/* Name skeleton */}
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              {/* Position skeleton */}
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
          {/* More button skeleton */}
          <div className="h-8 w-8 bg-gray-200 rounded flex-shrink-0" />
        </div>
        {/* Status badge skeleton */}
        <div className="h-6 bg-gray-200 rounded w-20 mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Contact info skeletons */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded flex-1" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>

        {/* Details section skeleton */}
        <div className="pt-2 border-t space-y-2">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-3 bg-gray-200 rounded w-20" />
            <div className="h-3 bg-gray-200 rounded w-28" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-3 bg-gray-200 rounded w-24" />
            <div className="h-3 bg-gray-200 rounded w-12" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-3 bg-gray-200 rounded w-16" />
            <div className="h-5 bg-gray-200 rounded w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Grid of skeleton cards for initial page load
 */
export function EmployeeSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 auto-rows-fr">
      {Array.from({ length: count }).map((_, i) => (
        <EmployeeCardSkeleton key={i} />
      ))}
    </div>
  );
}
