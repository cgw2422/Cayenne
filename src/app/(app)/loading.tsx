import { Skeleton } from "@/components/ui/primitives";

export default function AppLoading() {
  return (
    <div className="flex flex-col gap-4 px-5 pt-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-[280px] w-full rounded-[2rem]" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-32 w-full rounded-[1.5rem]" />
    </div>
  );
}
