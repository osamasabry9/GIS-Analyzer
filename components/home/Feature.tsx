import { memo, ReactNode } from "react";

 const Feature = memo(function Feature({
  icon,
  title,
  desc,
  index,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  index: number;
}) {
  return (
    <div
      className="rounded-xl border bg-background/60 backdrop-blur p-5 hover:shadow-[0_0_0_1px_rgba(16,185,129,.25),0_0_30px_rgba(168,85,247,.15)] transition-shadow fade-in-up"
      style={{ animationDelay: `${index * 0.4}s` }}
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{desc}</p>
    </div>
  );
});

export default Feature
