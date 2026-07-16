import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  SkipForward,
  Target,
  Award,
  Timer,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { fetchGoals, fetchAllGoals } from '@/lib/goals';
import { computeDayStats, computeStreak, formatTime } from '@/lib/stats';
import { PageHeader } from '@/components/PageHeader';
import { ProgressRing } from '@/components/ProgressRing';
import { EmptyState } from '@/components/EmptyState';
import { CardSkeleton } from '@/components/Skeletons';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { STATUS_COLORS, type Goal } from '@/types';

export default function HistoryPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dayGoals, setDayGoals] = useState<Goal[]>([]);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayLoading, setDayLoading] = useState(true);

  const dateISO = format(selectedDate, 'yyyy-MM-dd');

  const loadAllGoals = useCallback(async () => {
    if (!profile) return;
    try {
      const data = await fetchAllGoals(profile.id);
      setAllGoals(data);
    } catch {
      // silent
    }
    setLoading(false);
  }, [profile]);

  const loadDayGoals = useCallback(async () => {
    if (!profile) return;
    setDayLoading(true);
    try {
      const data = await fetchGoals(profile.id, dateISO);
      setDayGoals(data);
    } catch {
      // silent
    }
    setDayLoading(false);
  }, [profile, dateISO]);

  useEffect(() => {
    loadAllGoals();
  }, [loadAllGoals]);

  useEffect(() => {
    loadDayGoals();
  }, [loadDayGoals]);

  // Build a map of date -> completion rate for calendar coloring
  const dateMap = new Map<string, number>();
  const byDate = new Map<string, Goal[]>();
  for (const g of allGoals) {
    const arr = byDate.get(g.goal_date) ?? [];
    arr.push(g);
    byDate.set(g.goal_date, arr);
  }
  byDate.forEach((goals, date) => {
    dateMap.set(date, computeDayStats(goals).completionRate);
  });

  const stats = computeDayStats(dayGoals);
  const streak = computeStreak(allGoals, format(new Date(), 'yyyy-MM-dd'));

  const modifiers = {
    hasGoals: (date: Date) => dateMap.has(format(date, 'yyyy-MM-dd')),
  };

  const modifiersStyles = {
    hasGoals: {
      fontWeight: 600 as const,
    },
  };

  return (
    <div>
      <PageHeader
        title="Goal History"
        subtitle="Review your progress over time"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="font-semibold font-display mb-4">Calendar</h3>
          {loading ? (
            <div className="flex justify-center py-12">
              <CardSkeleton />
            </div>
          ) : (
            <>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                className="rounded-xl"
                classNames={{
                  day: 'relative',
                }}
                components={{
                  DayContent: ({ date: d }: { date?: Date }) => {
                    if (!d) return null;
                    const iso = format(d, 'yyyy-MM-dd');
                    const rate = dateMap.get(iso);
                    return (
                      <div className="relative flex items-center justify-center w-full h-full">
                        {rate !== undefined && (
                          <div
                            className="absolute inset-0 rounded-full opacity-20"
                            style={{
                              backgroundColor:
                                rate >= 80 ? STATUS_COLORS.completed : rate >= 50 ? '#f59e0b' : STATUS_COLORS.pending,
                            }}
                          />
                        )}
                        <span className="relative z-10">{format(d, 'd')}</span>
                      </div>
                    );
                  },
                }}
              />
              <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="size-3 rounded-full bg-success/30" />
                  <span className="text-muted-foreground">≥80%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-3 rounded-full bg-warning/30" />
                  <span className="text-muted-foreground">≥50%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-3 rounded-full bg-muted/40" />
                  <span className="text-muted-foreground">&lt;50%</span>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Day details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-4"
        >
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold font-display">{format(selectedDate, 'EEEE, d MMMM yyyy')}</h3>
                <p className="text-sm text-muted-foreground">Daily summary</p>
              </div>
              <ProgressRing progress={stats.completionRate} size={80} strokeWidth={8} />
            </div>

            {dayLoading ? (
              <div className="space-y-2">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : stats.total === 0 ? (
              <EmptyState
                icon={<Target className="size-8 text-muted-foreground" />}
                title="No goals on this day"
                description="There were no goals recorded for this date."
              />
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-muted/30 rounded-xl p-3 text-center">
                    <Target className="size-5 mx-auto text-primary mb-1" />
                    <p className="text-2xl font-bold font-display">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="bg-success/10 rounded-xl p-3 text-center">
                    <CheckCircle2 className="size-5 mx-auto text-success mb-1" />
                    <p className="text-2xl font-bold font-display">{stats.completed}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="bg-amber-500/10 rounded-xl p-3 text-center">
                    <Clock className="size-5 mx-auto text-amber-500 mb-1" />
                    <p className="text-2xl font-bold font-display">{stats.pending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3 text-center">
                    <SkipForward className="size-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-2xl font-bold font-display">{stats.skipped}</p>
                    <p className="text-xs text-muted-foreground">Skipped</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 bg-muted/30 rounded-xl p-3">
                    <Award className="size-5 text-warning" />
                    <div>
                      <p className="text-xs text-muted-foreground">Daily Score</p>
                      <p className="font-bold font-display">{stats.score} pts</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-muted/30 rounded-xl p-3">
                    <Timer className="size-5 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">Time Spent</p>
                      <p className="font-bold font-display">{formatTime(stats.timeSpent)}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Goals list for selected day */}
          {!dayLoading && dayGoals.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h3 className="font-semibold font-display mb-3">Goals</h3>
              <div className="space-y-2">
                {dayGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/30"
                  >
                    <div
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[goal.status] }}
                    />
                    <span className={`flex-1 text-sm font-medium truncate ${goal.status !== 'pending' ? 'line-through text-muted-foreground' : ''}`}>
                      {goal.title}
                    </span>
                    {goal.start_time && (
                      <span className="text-xs text-muted-foreground">{goal.start_time}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overall streak card */}
          <div className="glass rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                <TrendingUp className="size-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold font-display">{streak} {streak === 1 ? 'day' : 'days'}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/today')}>
              Today's Goals <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
