'use client';

import { useEffect, useRef } from 'react';

interface StatsCardProps {
  label: string;
  value: number;
  trend: string;
  icon: React.ReactNode;
  variant: 'info' | 'success' | 'warning';
  onClick?: () => void;
}

export default function StatsCard({ label, value, trend, icon, variant, onClick }: StatsCardProps) {
  const valueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Counter animation
    if (!valueRef.current) return;

    const element = valueRef.current;
    const target = value;
    const duration = 800;
    const start = 0;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(start + (target - start) * easeOutQuart);
      
      element.textContent = current.toString();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = target.toString();
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  const variantStyles = {
    info: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:shadow-blue-500/20',
    success: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 hover:shadow-emerald-500/20',
    warning: 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200 hover:shadow-amber-500/20',
  };

  const iconBgStyles = {
    info: 'bg-blue-500/10 text-blue-600',
    success: 'bg-emerald-500/10 text-emerald-600',
    warning: 'bg-amber-500/10 text-amber-600',
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative p-4 rounded-xl border transition-all duration-300 cursor-pointer
        ${variantStyles[variant]}
        hover:shadow-lg hover:-translate-y-0.5
      `}
    >
      {/* Content */}
      <div className="relative z-10">
        <div className="text-xs font-semibold text-slate-600 mb-1">{label}</div>
        <div ref={valueRef} className="text-3xl font-bold text-slate-900 mb-1">
          0
        </div>
        <div className="text-xs text-slate-600">{trend}</div>
      </div>

      {/* Icon */}
      <div className={`absolute top-4 right-4 w-10 h-10 rounded-lg flex items-center justify-center text-xl ${iconBgStyles[variant]}`}>
        {icon}
      </div>
    </div>
  );
}
