
import { forwardRef } from 'react';

export const Card = forwardRef(function Card({ className = '', ...props }, ref) {
  return (
    <div ref={ref} className={`rounded-lg border bg-white shadow ${className}`} {...props} />
  );
});

export function CardHeader({ className = '', ...props }) {
  return <div className={`border-b px-4 py-2 ${className}`} {...props} />;
}

export function CardTitle({ className = '', ...props }) {
  return <h3 className={`text-lg font-semibold ${className}`} {...props} />;
}

export function CardContent({ className = '', ...props }) {
  return <div className={`p-4 ${className}`} {...props} />;
}
