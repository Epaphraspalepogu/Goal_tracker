import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User as UserIcon,
  Lock,
  Bell,
  Palette,
  Trash2,
  Upload,
  Loader2,
  Moon,
  Sun,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Valid email required'),
});

const passwordSchema = z
  .object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    dailyReminder: true,
    streakAlert: true,
    weeklyReport: false,
  });

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name ?? '',
      username: profile?.username ?? '',
      email: profile?.email ?? '',
    },
  });

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const initials = (profile?.name || profile?.username || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleProfileUpdate = async (data: ProfileData) => {
    if (!profile) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ name: data.name, username: data.username })
      .eq('id', profile.id);
    setSavingProfile(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success('Profile updated');
  };

  const handlePasswordChange = async (data: PasswordData) => {
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: data.newPassword });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    passwordForm.reset();
    toast.success('Password changed successfully');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${profile.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photo: urlData.publicUrl })
        .eq('id', profile.id);
      if (updateError) throw updateError;
      await refreshProfile();
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    }
    setUploading(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    // Delete all goals first
    await supabase.from('goals').delete().eq('user_id', user.id);
    await supabase.from('profiles').delete().eq('id', user.id);
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    setDeleting(false);
    if (error) {
      toast.error('Failed to delete account. Please contact support.');
      return;
    }
    toast.success('Account deleted');
    signOut();
    navigate('/');
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="glass rounded-xl p-1 mb-6 flex w-full sm:w-auto">
          <TabsTrigger value="profile" className="flex-1 sm:flex-none"><UserIcon className="size-4 mr-1.5" /> Profile</TabsTrigger>
          <TabsTrigger value="security" className="flex-1 sm:flex-none"><Lock className="size-4 mr-1.5" /> Security</TabsTrigger>
          <TabsTrigger value="appearance" className="flex-1 sm:flex-none"><Palette className="size-4 mr-1.5" /> Appearance</TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 sm:flex-none"><Bell className="size-4 mr-1.5" /> Notifications</TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="size-20 border-2 border-primary/20">
                <AvatarImage src={profile?.photo ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                    {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    Upload Avatar
                  </span>
                </label>
                <p className="text-xs text-muted-foreground mt-2">JPG, PNG up to 2MB</p>
              </div>
            </div>

            <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input {...profileForm.register('name')} />
                {profileForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{profileForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input {...profileForm.register('username')} />
                {profileForm.formState.errors.username && (
                  <p className="text-sm text-destructive">{profileForm.formState.errors.username.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" disabled {...profileForm.register('email')} />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? <Loader2 className="size-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </form>
          </motion.div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-2xl">
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold font-display mb-4">Change Password</h3>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      {...passwordForm.register('newPassword')}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    >
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...passwordForm.register('confirmPassword')}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                <Button type="submit" disabled={savingPassword}>
                  {savingPassword ? <Loader2 className="size-4 animate-spin" /> : 'Update Password'}
                </Button>
              </form>
            </div>

            <div className="glass rounded-2xl p-6 border-destructive/20">
              <h3 className="font-semibold font-display text-destructive mb-2">Delete Account</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="size-4 mr-1" /> Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your account, all your goals, and data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deleting}
                    >
                      {deleting ? <Loader2 className="size-4 animate-spin" /> : 'Yes, delete my account'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.div>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 max-w-2xl">
            <h3 className="font-semibold font-display mb-4">Theme</h3>
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="size-5 text-primary" /> : <Sun className="size-5 text-warning" />}
                <div>
                  <p className="font-medium">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                  <p className="text-sm text-muted-foreground">Toggle between dark and light themes</p>
                </div>
              </div>
              <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
            </div>
          </motion.div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 max-w-2xl space-y-3">
            <h3 className="font-semibold font-display mb-4">Notification Preferences</h3>
            {[
              { key: 'dailyReminder' as const, label: 'Daily Goal Reminder', desc: 'Get reminded to set your daily goals' },
              { key: 'streakAlert' as const, label: 'Streak Alerts', desc: 'Notifications when your streak is at risk' },
              { key: 'weeklyReport' as const, label: 'Weekly Report', desc: 'Receive a weekly summary of your progress' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={notifSettings[item.key]}
                  onCheckedChange={(v) => setNotifSettings((prev) => ({ ...prev, [item.key]: v }))}
                />
              </div>
            ))}
            <Button onClick={() => toast.success('Notification preferences saved')} className="mt-2">
              Save Preferences
            </Button>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
