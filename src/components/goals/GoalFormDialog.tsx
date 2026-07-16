import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORIES, GOAL_COLORS, PRIORITIES, type Goal, type GoalInput, type Priority } from '@/types';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  color: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface GoalFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: GoalInput) => Promise<void>;
  editingGoal?: Goal | null;
}

export function GoalFormDialog({ open, onClose, onSubmit, editingGoal }: GoalFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editingGoal
      ? {
          title: editingGoal.title,
          description: editingGoal.description ?? '',
          start_time: editingGoal.start_time ?? '',
          end_time: editingGoal.end_time ?? '',
          category: editingGoal.category,
          priority: editingGoal.priority,
          color: editingGoal.color,
        }
      : {
          title: '',
          description: '',
          start_time: '',
          end_time: '',
          category: 'General',
          priority: 'medium',
          color: GOAL_COLORS[0],
        },
  });

  const selectedColor = watch('color') || GOAL_COLORS[0];
  const selectedCategory = watch('category') || 'General';
  const selectedPriority = watch('priority') || 'medium';

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit({
      title: data.title,
      description: data.description || '',
      start_time: data.start_time || undefined,
      end_time: data.end_time || undefined,
      category: data.category || 'General',
      priority: (data.priority as Priority) || 'medium',
      color: data.color || GOAL_COLORS[0],
    });
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g., Morning Workout" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Add details about your goal..." rows={2} {...register('description')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input id="start_time" type="time" {...register('start_time')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input id="end_time" type="time" {...register('end_time')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={(v) => setValue('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={selectedPriority} onValueChange={(v) => setValue('priority', v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {GOAL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={`size-8 rounded-full transition-all ${selectedColor === color ? 'ring-2 ring-offset-2 ring-foreground scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : editingGoal ? 'Save Changes' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
