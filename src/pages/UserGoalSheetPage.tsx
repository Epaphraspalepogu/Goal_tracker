import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Lock,
  Target,
  Clock,
  CheckCircle2,
  SkipForward,
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { fetchGoals } from '@/lib/goals';
import { computeDayStats, formatTime } from '@/lib/stats';
import { useAuth } from '@/context/AuthContext';
import { useDateState } from '@/hooks/useDateState';
import { ProgressRing } from '@/components/ProgressRing';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { STATUS_COLORS, type Goal, type Profile } from '@/types';

export default function UserGoalSheetPage() {
  const { userId } = useParams<{ userId: string }>();
  const { profile: currentUser } = useAuth();
  const { date, dateISO, goPrev, goNext, goToday, setSpecificDate } = useDateState();
  const [user, setUser] = useState<Profile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const isOwn = currentUser?.id === userId;

  const loadUser = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setUser(data as Profile | null);
  }, [userId]);

  const loadGoals = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await fetchGoals(userId, dateISO);
      setGoals(data);
    } catch {
      // silent
    }
    setLoading(false);
  }, [userId, dateISO]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const stats = computeDayStats(goals);
  const initials = (user?.name || user?.username || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div>
      {/* Read-only banner */}
      {!isOwn && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl bg-muted/30 text-sm text-muted-foreground"
        >
          <Lock className="size-4" />
          Read Only — You can view {user?.name?.split(' ')[0] || 'this user'}'s goals but cannot modify them.
        </motion.div>
      )}

      {/* User header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-center gap-4"
      >
        <Avatar className="size-16 border-2 border-primary/20">
          <AvatarImage src={user?.photo ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="text-center sm:text-left">
          <h1 className="text-xl font-bold font-display">{user?.name}</h1>
          <p className="text-muted-foreground">@{user?.username}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{format(date, 'EEEE, d MMMM yyyy')}</p>
        </div>
        <div className="sm:ml-auto flex items-center gap-4">
          <div className="text-center">
            <ProgressRing progress={stats.completionRate} size={72} strokeWidth={7} />
            <p className="text-xs text-muted-foreground mt-1">Completion</p>
          </div>
        </div>
      </motion.div>

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
          {dateISO !== format(new Date(), 'yyyy-MM-dd') && (
            <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
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
      {goals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
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
      )}

      {/* Goals list (read-only) */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-4 shimmer h-16" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={<Target className="size-8 text-muted-foreground" />}
          title="No goals for this day"
          description={`${user?.name?.split(' ')[0] || 'This user'} didn't create any goals for ${format(date, 'MMMM d')}.`}
        />
      ) : (
        <div className="space-y-3">
          {goals.map((goal, i) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass rounded-2xl p-4 flex items-center gap-3 sm:gap-4 ${
                goal.status === 'skipped' ? 'opacity-60' : ''
              }`}
            >
              {/* Status indicator (read-only) */}
              <div
                className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                  goal.status === 'completed'
                    ? 'bg-success text-white'
                    : goal.status === 'skipped'
                      ? 'bg-muted text-muted-foreground'
                      : 'border-2 border-border'
                }`}
                style={goal.status === 'pending' ? { borderColor: goal.color } : undefined}
              >
                {goal.status === 'completed' && <Check className="size-5" />}
                {goal.status === 'skipped' && <SkipForward className="size-4" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: goal.color }} />
                  <h3 className={`font-semibold truncate ${goal.status !== 'pending' ? 'line-through text-muted-foreground' : ''}`}>
                    {goal.title}
                  </h3>
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
                  <span
                    className="px-2 py-0.5 rounded-md font-medium"
                    style={{
                      backgroundColor: `${STATUS_COLORS[goal.status]}20`,
                      color: STATUS_COLORS[goal.status],
                    }}
                  >
                    {goal.status}
                  </span>
                </div>
              </div>

              {/* Time spent for completed goals */}
              {goal.status === 'completed' && goal.start_time && goal.end_time && (
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="text-sm font-medium">{formatTime(
                    (Number(goal.end_time.split(':')[0]) * 60 + Number(goal.end_time.split(':')[1])) -
                    (Number(goal.start_time.split(':')[0]) * 60 + Number(goal.start_time.split(':')[1]))
                  )}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
