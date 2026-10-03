import React from 'react';

export default function DemoDataBadge() {
  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
  if (!isDemo) return null;

  return (
    <span className="rounded-md border border-warning/30 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
      Demo data
    </span>
  );
}
