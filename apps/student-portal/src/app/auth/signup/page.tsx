'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Lock, User, Hash, Building, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/apiClient';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rollNumber: z.string().optional(),
  department: z.string().optional(),
  semester: z.coerce.number().int().min(1).max(12).optional(),
});

type SignupForm = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: SignupForm) => {
    try {
      const res = await apiClient.post('/auth/signup', { ...data, role: 'student' });
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Welcome to ExamGuard!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (status === 409 || (typeof message === 'string' && message.includes('Email already registered'))) {
        try {
          toast.loading('Checking existing account...');
          const loginRes = await apiClient.post('/auth/login', { email: data.email, password: data.password });
          toast.dismiss();
          const { user, accessToken, refreshToken } = loginRes.data.data;
          setAuth(user, accessToken, refreshToken);
          toast.success(`Welcome back, ${user.name}!`);
          router.push('/dashboard');
          return;
        } catch {
          toast.dismiss();
          toast.error('Email already registered. Please sign in or enter correct password.');
          router.push('/auth/login');
          return;
        }
      }
      toast.error(typeof message === 'string' ? message : 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-mesh">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4c7ef3] to-[#7c3aed] flex items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Create Account</h1>
          <p className="text-sm text-[#8892b0] mt-1">ExamGuard Student Portal</p>
        </div>

        <div className="card-glow">
          <p className="text-sm text-[#8892b0] mb-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#4c7ef3] hover:underline font-medium">Sign in</Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5568]" />
                <input {...register('name')} placeholder="Your full name" className="input pl-10" id="name" />
              </div>
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5568]" />
                <input {...register('email')} type="email" placeholder="student@example.com" className="input pl-10" id="signup-email" />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5568]" />
                <input {...register('password')} type="password" placeholder="Min 8 characters" className="input pl-10" id="signup-password" />
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Roll Number</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5568]" />
                  <input {...register('rollNumber')} placeholder="CS2024001" className="input pl-10" id="roll-number" />
                </div>
              </div>
              <div>
                <label className="label">Semester</label>
                <input {...register('semester')} type="number" min={1} max={12} placeholder="6" className="input" id="semester" />
              </div>
            </div>

            <div>
              <label className="label">Department</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5568]" />
                <input {...register('department')} placeholder="Computer Science" className="input pl-10" id="department" />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 gap-2" id="signup-submit">
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
