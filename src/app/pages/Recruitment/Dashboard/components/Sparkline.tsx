import React from 'react';

interface SparklineProps {
  values: number[];
  color?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  values,
  color = '#ffffff',
}) => {
  const max = Math.max(...values, 1);
  const points = values
    .map(
      (v, i) => `${(i / (values.length - 1)) * 100},${100 - (v / max) * 100}`,
    )
    .join(' ');

  return (
    <svg
      className="block w-full h-6 mt-2"
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.95}
      />
    </svg>
  );
};

export default Sparkline;
