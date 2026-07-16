import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  SkipForward,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  GripVertical,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PRIORITY_COLORS, type Goal, type GoalStatus } from '@/types';

interface GoalCardProps {
  goal: Goal;
  onToggleStatus: (status: GoalStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  isDragging: boolean;
}

export function GoalCard({
  goal,
  onToggleStatus,
  onEdit,
  onDelete,
  onDuplicate,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}: GoalCardProps) {
  const isCompleted = goal.status === 'completed';
  const isSkipped = goal.status === 'skipped';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.2 }}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        'glass rounded-2xl p-4 flex items-center gap-3 sm:gap-4 group cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50',
        isCompleted && 'border-success/30',
        isSkipped && 'opacity-60',
      )}
    >
      {/* Drag handle */}
      <GripVertical className="size-5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors hidden sm:block" />

      {/* Status toggle */}
      <button
        onClick={() => onToggleStatus(isCompleted ? 'pending' : 'completed')}
        className={cn(
          'size-10 rounded-xl flex items-center justify-center transition-all shrink-0',
          isCompleted
            ? 'bg-success text-white shadow-lg shadow-success/30'
            : isSkipped
              ? 'bg-muted text-muted-foreground'
              : 'border-2 border-border hover:border-primary',
        )}
        style={!isCompleted && !isSkipped ? { borderColor: goal.color } : undefined}
      >
        <AnimatePresence mode="wait">
          {isCompleted ? (
            <motion.div
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <Check className="size-5" />
            </motion.div>
          ) : isSkipped ? (
            <SkipForward className="size-4" />
          ) : null}
        </AnimatePresence>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: goal.color }} />
          <h3 className={cn(
            'font-semibold truncate',
            isCompleted && 'line-through text-muted-foreground',
            isSkipped && 'line-through text-muted-foreground',
          )}>
            {goal.title}
          </h3>
          <div
            className="text-xs px-1.5 py-0.5 rounded-md font-medium shrink-0"
            style={{ backgroundColor: `${PRIORITY_COLORS[goal.priority]}20`, color: PRIORITY_COLORS[goal.priority] }}
          >
            {goal.priority}
          </div>
        </div>
        {goal.description && (
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{goal.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          <span className="px-2 py-0.5 rounded-md bg-muted/50">{goal.category}</span>
          {goal.start_time && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {goal.start_time}{goal.end_time ? ` – ${goal.end_time}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg"
          onClick={() => onToggleStatus(isSkipped ? 'pending' : 'skipped')}
          title="Mark as skipped"
        >
          <SkipForward className="size-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 rounded-lg">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="size-4 mr-2" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="size-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
