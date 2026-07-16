import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Target, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Welcome back!');
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

        <h2 className="text-2xl font-bold font-display">Welcome back</h2>
        <p className="text-muted-foreground mt-2">Sign in to your account to continue</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="you@example.com" className="pl-10" {...register('email')} />
            </div>
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input id="password" type="password" placeholder="••••••••" className="pl-10" {...register('password')} />
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <>Sign In <ArrowRight className="size-4 ml-1" /></>}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
