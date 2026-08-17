import "./Skeleton.css";

export function Skeleton({ width = "100%", height = "16px", radius = "8px" }) {
  return <span className="skeleton" style={{ width, height, borderRadius: radius }} />;
}

export function SkeletonLines({ count = 3 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} width={i === count - 1 ? "60%" : "100%"} />
      ))}
    </div>
  );
}
