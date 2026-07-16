import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-4',
        className,
      )}
    >
      <div className="size-16 rounded-2xl glass flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold font-display">{title}</h3>
      <p className="text-muted-foreground mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
