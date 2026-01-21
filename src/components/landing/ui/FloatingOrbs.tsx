"use client";

export function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Primary cyan orb - top left */}
      <div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full animate-float-slow"
        style={{
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.05) 40%, transparent 70%)",
        }}
      />

      {/* Secondary purple/cyan gradient orb - top right */}
      <div
        className="absolute -top-20 -right-40 w-[600px] h-[600px] rounded-full animate-float"
        style={{
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 70%)",
        }}
      />

      {/* Small accent orb - middle */}
      <div
        className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full animate-float-reverse"
        style={{
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 60%)",
        }}
      />
    </div>
  );
}
