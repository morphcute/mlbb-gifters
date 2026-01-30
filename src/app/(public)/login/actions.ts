'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { createSession } from '@/lib/auth';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;

  if (!email || !password || !role) {
      redirect('/login?error=Missing credentials');
  }

  try {
      const user = await prisma.user.findUnique({
          where: { email },
      });

      if (!user || !user.password) {
          redirect('/login?error=Invalid credentials');
      }

      // Check role matches
      if (user.role !== role) {
          redirect('/login?error=Invalid role for this user');
      }

      // Verify password
      const passwordValid = await compare(password, user.password);

      if (!passwordValid) {
          redirect('/login?error=Invalid credentials');
      }

      // Create session
      await createSession(user.id, user.role);

      if (role === 'ADMIN') {
          redirect('/dashboard/admin');
      } else if (role === 'GIFTER') {
          redirect('/dashboard/gifter');
      } else {
          redirect('/');
      }
  } catch (error) {
      if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
          throw error;
      }
      console.error('Login error:', error);
      redirect('/login?error=Authentication failed');
  }
}
