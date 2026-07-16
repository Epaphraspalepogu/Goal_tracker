import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Target, CheckCircle2, Calendar, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-background">
        <div className="absolute inset-0 gradient-bg" />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Target className="size-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display">GoalFlow</span>
          </Link>

          <div className="space-y-8">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl font-bold font-display leading-tight"
              >
                Achieve more,
                <br />
                <span className="gradient-text">one goal at a time.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-4 text-muted-foreground text-lg max-w-md"
              >
                Track your daily goals, build streaks, and watch your productivity soar.
              </motion.p>
            </div>

            <div className="space-y-4">
              {[
                { icon: CheckCircle2, title: 'Daily Goal Tracking', desc: 'Create and manage goals with ease' },
                { icon: Calendar, title: 'History & Calendar', desc: 'Review your progress over time' },
                { icon: TrendingUp, title: 'Analytics & Insights', desc: 'Visualize your productivity trends' },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="size-10 rounded-lg glass flex items-center justify-center">
                    <f.icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{f.title}</p>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">© 2026 GoalFlow. All rights reserved.</p>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-50" />
        <div className="relative z-10 w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
