'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, Loader2 } from 'lucide-react';
import { signIn, signUp, googleSignIn } from '@/lib/auth';

// Form validation schema
const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AuthFormData = z.infer<typeof authSchema>;

interface AuthFormProps {
  type: 'login' | 'register';
}

export function AuthForm({ type }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Fix hydration issues by only rendering after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    }
  });

  const onSubmit = async (data: AuthFormData) => {
    try {
      setIsLoading(true);
      
      let result;
      if (type === 'login') {
        result = await signIn({
          email: data.email,
          password: data.password
        });
      } else {
        result = await signUp({
          email: data.email,
          password: data.password,
          firstName: '',
          lastName: ''
        });
      }
      
      if (result.success) {
        toast({
          title: type === 'login' ? 'Signed in' : 'Account created',
          description: type === 'login' 
            ? 'You have been signed in successfully.' 
            : 'Your account has been created. Please check your email for verification.',
        });
        router.push('/dashboard');
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'An error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await googleSignIn();
      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to connect to Google'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleMode = () => {
    router.push(type === 'login' ? '/auth/register' : '/auth/login');
  };

  // Don't render until client-side to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6 w-full max-w-[350px]">
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center space-y-4 w-[280px] max-w-[90vw]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">
              {type === 'login' ? 'Signing in...' : 'Creating account...'}
            </p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...register('email')}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            {...register('password')}
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        {type === 'register' && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              {...register('confirmPassword')}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {type === 'login' ? 'Signing in...' : 'Creating account...'}
            </span>
          ) : (
            type === 'login' ? 'Sign In' : 'Create Account'
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full mt-2"
          onClick={toggleMode}
          disabled={isLoading}
        >
          {type === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </Button>
      </form>

      {type === 'login' && (
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting to Google...
            </span>
          ) : (
            "Continue with Google"
          )}
        </Button>
      )}
    </div>
  );
} 