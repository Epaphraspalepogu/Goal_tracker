import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  gradient: string;
  delay?: number;
  subtitle?: string;
}

export function StatCard({ title, value, icon, gradient, delay = 0, subtitle }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4 }}
      className="glass rounded-2xl p-5 relative overflow-hidden group cursor-default"
    >
      <div className={cn('absolute -top-8 -right-8 size-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40', gradient)} />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold font-display mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={cn('size-11 rounded-xl flex items-center justify-center text-white shadow-lg', gradient)}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
