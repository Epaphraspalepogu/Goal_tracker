import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Target, Mail, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success('Password reset link sent to your email');
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

        {sent ? (
          <div className="text-center space-y-4">
            <div className="size-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <Mail className="size-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold font-display">Check your email</h2>
            <p className="text-muted-foreground">
              We've sent a password reset link to your email address. Follow the link to reset your password.
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="size-4 mr-1" /> Back to login
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold font-display">Forgot password</h2>
            <p className="text-muted-foreground mt-2">Enter your email to receive a reset link</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@example.com" className="pl-10" {...register('email')} />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <>Send Reset Link <ArrowRight className="size-4 ml-1" /></>}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Remember your password?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </AuthLayout>
  );
}
