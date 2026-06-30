export default function SkeletonCard() {
  return (
    <div className="provider-card">
      <div className="flex gap-3">
        <div className="skeleton w-20 h-20 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
          <div className="flex gap-2 mt-2">
            <div className="skeleton h-3 w-16" />
            <div className="skeleton h-3 w-16" />
          </div>
          <div className="skeleton h-3 w-full mt-2" />
        </div>
      </div>
    </div>
  );
}