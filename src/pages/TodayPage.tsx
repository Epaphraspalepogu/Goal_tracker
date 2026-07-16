import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  SkipForward,
  Target,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useDateState } from '@/hooks/useDateState';
import {
  fetchGoals,
  createGoal,
  updateGoal,
  updateGoalStatus,
  deleteGoal,
  duplicateGoal,
  reorderGoals,
} from '@/lib/goals';
import { computeDayStats } from '@/lib/stats';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalFormDialog } from '@/components/goals/GoalFormDialog';
import { PageHeader } from '@/components/PageHeader';
import { ProgressRing } from '@/components/ProgressRing';
import { EmptyState } from '@/components/EmptyState';
import { GoalListSkeleton } from '@/components/Skeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CATEGORIES, type Goal, type GoalInput, type GoalStatus } from '@/types';

export default function TodayPage() {
  const { profile } = useAuth();
  const { date, dateISO, goPrev, goNext, goToday, setSpecificDate } = useDateState();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const isToday = dateISO === format(new Date(), 'yyyy-MM-dd');

  const loadGoals = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const data = await fetchGoals(profile.id, dateISO);
      setGoals(data);
    } catch {
      toast.error('Failed to load goals');
    }
    setLoading(false);
  }, [profile, dateISO]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleCreate = () => {
    setEditingGoal(null);
    setDialogOpen(true);
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: GoalInput) => {
    if (!profile) return;
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, data);
        toast.success('Goal updated');
      } else {
        await createGoal(profile.id, dateISO, data);
        toast.success('Goal created');
      }
      loadGoals();
    } catch {
      toast.error('Failed to save goal');
    }
  };

  const handleToggleStatus = async (goal: Goal, status: GoalStatus) => {
    try {
      await updateGoalStatus(goal.id, status);
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, status } : g)));
      if (status === 'completed') toast.success('Goal completed! 🎉');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (goal: Goal) => {
    try {
      await deleteGoal(goal.id);
      setGoals((prev) => prev.filter((g) => g.id !== goal.id));
      toast.success('Goal deleted');
    } catch {
      toast.error('Failed to delete goal');
    }
  };

  const handleDuplicate = async (goal: Goal) => {
    try {
      await duplicateGoal(goal);
      loadGoals();
      toast.success('Goal duplicated');
    } catch {
      toast.error('Failed to duplicate goal');
    }
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) return;
    const reordered = [...goals];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    setGoals(reordered);
    setDragIndex(null);
    try {
      await reorderGoals(reordered);
    } catch {
      toast.error('Failed to save order');
      loadGoals();
    }
  };

  const handleExport = () => {
    const csv = ['Title,Description,Start Time,End Time,Category,Priority,Status'];
    goals.forEach((g) => {
      csv.push(`"${g.title}","${g.description ?? ''}","${g.start_time ?? ''}","${g.end_time ?? ''}","${g.category}","${g.priority}","${g.status}"`);
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goals-${dateISO}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Goals exported to CSV');
  };

  const filteredGoals = goals.filter((g) => {
    if (search && !g.title.toLowerCase().includes(search.toLowerCase()) && !g.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory !== 'all' && g.category !== filterCategory) return false;
    if (filterStatus !== 'all' && g.status !== filterStatus) return false;
    return true;
  });

  const stats = computeDayStats(goals);

  return (
    <div>
      <PageHeader
        title="Today's Goals"
        subtitle={format(date, 'EEEE, d MMMM yyyy')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={goals.length === 0}>
              <Download className="size-4 mr-1" /> Export
            </Button>
            <Button size="sm" onClick={handleCreate}>
              <Plus className="size-4 mr-1" /> Add Goal
            </Button>
          </div>
        }
      />

      {/* Date navigation */}
      <div className="flex items-center justify-between gap-4 mb-6 glass rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goPrev} className="rounded-lg">
            <ChevronLeft className="size-5" />
          </Button>
          <div className="text-center min-w-[180px]">
            <p className="font-semibold font-display">{format(date, 'EEEE')}</p>
            <p className="text-sm text-muted-foreground">{format(date, 'd MMMM yyyy')}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={goNext} className="rounded-lg">
            <ChevronRight className="size-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {!isToday && (
            <Button variant="outline" size="sm" onClick={goToday}>
              Today
            </Button>
          )}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="size-4 mr-1" /> Pick Date
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 glass" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  if (d) {
                    setSpecificDate(d);
                    setCalendarOpen(false);
                  }
                }}
                className="rounded-xl"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <ProgressRing progress={stats.completionRate} size={64} strokeWidth={6} showLabel={false} />
          <div>
            <p className="text-sm text-muted-foreground">Completion</p>
            <p className="text-xl font-bold font-display">{stats.completionRate}%</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Target className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl font-bold font-display">{stats.total}</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="size-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-xl font-bold font-display">{stats.completed}</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Clock className="size-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-xl font-bold font-display">{stats.pending}</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-muted flex items-center justify-center">
            <SkipForward className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Skipped</p>
            <p className="text-xl font-bold font-display">{stats.skipped}</p>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      {goals.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search goals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="size-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Goals list */}
      {loading ? (
        <GoalListSkeleton />
      ) : filteredGoals.length === 0 ? (
        <EmptyState
          icon={<Target className="size-8 text-primary" />}
          title={goals.length === 0 ? 'No goals for this day' : 'No goals match your filters'}
          description={
            goals.length === 0
              ? 'Start by creating your first goal for this day.'
              : 'Try adjusting your search or filters.'
          }
          action={
            goals.length === 0 ? (
              <Button onClick={handleCreate}>
                <Plus className="size-4 mr-1" /> Create Goal
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredGoals.map((goal, i) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onToggleStatus={(status) => handleToggleStatus(goal, status)}
                onEdit={() => handleEdit(goal)}
                onDelete={() => handleDelete(goal)}
                onDuplicate={() => handleDuplicate(goal)}
                onDragStart={() => handleDragStart(i)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(i)}
                isDragging={dragIndex === i}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <GoalFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        editingGoal={editingGoal}
      />
    </div>
  );
}
