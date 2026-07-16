import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bell, Sun, Moon, LogOut, Settings, User as UserIcon, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  const today = format(new Date(), 'EEEE, d MMMM yyyy');
  const initials = (profile?.name || profile?.username || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 glass border-b border-border/50">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-muted">
            <Menu className="size-5" />
          </button>
          <div className="hidden sm:block">
            <p className="text-sm text-muted-foreground">{today}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setNotifOpen(!notifOpen)}>
              <Bell className="size-4.5" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
            </Button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-12 w-72 glass rounded-xl shadow-xl border border-border/50 p-4 z-50"
                >
                  <p className="font-semibold text-sm mb-2">Notifications</p>
                  <p className="text-sm text-muted-foreground">No new notifications. You're all caught up!</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme toggle */}
          <Button variant="ghost" size="icon" className="rounded-full" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
          </Button>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full hover:bg-muted/50 p-1 pr-2 transition-colors">
                <Avatar className="size-8 border border-border">
                  <AvatarImage src={profile?.photo ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium">{profile?.name || profile?.username}</span>
                <ChevronDown className="size-3.5 text-muted-foreground hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{profile?.name}</span>
                  <span className="text-xs text-muted-foreground font-normal">@{profile?.username}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/app/settings')}>
                <UserIcon className="size-4 mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/app/settings')}>
                <Settings className="size-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                <LogOut className="size-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
