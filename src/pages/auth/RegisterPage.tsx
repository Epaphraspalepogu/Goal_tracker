import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Target, Mail, Lock, User, ArrowRight, Loader2, AtSign } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

const schema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const username = watch('username');

  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      setUsernameAvailable(!data);
    }, 500);
    return () => clearTimeout(t);
  }, [username]);

  const onSubmit = async (data: FormData) => {
    if (usernameAvailable === false) {
      toast.error('Username is already taken');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          username: data.username,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Account created! Welcome to GoalFlow.');
    navigate('/app');
  };

  return (
    <AuthLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="size-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Target className="size-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold font-display">GoalFlow</span>
        </div>

        <h2 className="text-2xl font-bold font-display">Create your account</h2>
        <p className="text-muted-foreground mt-2">Start tracking your goals today</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input id="fullName" placeholder="John Doe" className="pl-10" {...register('fullName')} />
            </div>
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input id="username" placeholder="johndoe" className="pl-10" {...register('username')} />
            </div>
            {username && username.length >= 3 && (
              <p className={`text-sm ${usernameAvailable ? 'text-success' : 'text-destructive'}`}>
                {usernameAvailable ? 'Available' : 'Already taken'}
              </p>
            )}
            {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="you@example.com" className="pl-10" {...register('email')} />
            </div>
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" className="pl-10" {...register('password')} />
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <>Create Account <ArrowRight className="size-4 ml-1" /></>}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
