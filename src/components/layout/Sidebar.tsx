import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  History,
  BarChart3,
  Settings,
  Target,
  X,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Profile } from '@/types';

const navItems = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/today', label: "Today's Goals", icon: CheckSquare },
  { to: '/app/calendar', label: 'Calendar', icon: Calendar },
  { to: '/app/history', label: 'Goal History', icon: History },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile: currentUser } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });
      setUsers((data ?? []) as Profile[]);
      setLoading(false);
    })();
  }, []);

  const isMainActive = (item: (typeof navItems)[number]) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);

  const activeUserId = location.pathname.match(/^\/app\/user\/([^/]+)/)?.[1];

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen w-64 z-50 transition-transform duration-300',
          'glass border-r border-border/50 flex flex-col',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex items-center justify-between p-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Target className="size-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold font-display">GoalFlow</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto scrollbar-thin flex flex-col">
          {/* Main navigation */}
          <div className="space-y-1 pb-3">
            {navItems.map((item) => {
              const active = isMainActive(item);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group',
                    active
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-primary shadow-lg shadow-primary/30"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className="size-4.5 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Divider */}
          <div className="border-t border-border/50 my-2" />

          {/* Users section */}
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Users</p>
          </div>

          <div className="space-y-0.5 flex-1">
            {loading ? (
              <div className="space-y-1 px-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-2 py-2">
                    <div className="size-7 rounded-full shimmer" />
                    <div className="h-3 w-20 shimmer rounded" />
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-2">No users yet</p>
            ) : (
              users.map((user) => {
                const isActive = activeUserId === user.id;
                const isCurrentUser = currentUser?.id === user.id;
                const initials = (user.name || user.username || 'U')
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      navigate(`/app/user/${user.id}`);
                      onClose();
                    }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all relative group',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="size-7 border border-border">
                        <AvatarImage src={user.photo ?? undefined} />
                        <AvatarFallback className="text-[10px] font-semibold bg-muted">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-success border-2 border-card" />
                    </div>
                    <span className="flex-1 text-left truncate font-medium">
                      {isCurrentUser ? 'You' : user.name?.split(' ')[0] || user.username}
                    </span>
                    {isActive && <ChevronRight className="size-3.5 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </nav>

        {/* <div className="p-4 shrink-0">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground">Powered by</p>
            <p className="text-sm font-semibold gradient-text">GoalFlow</p>
          </div>
        </div> */}
      </aside>
    </>
  );
}
