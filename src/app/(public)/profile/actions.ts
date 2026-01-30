'use server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateProfileAction(formData: FormData) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  if (!name || !email) {
    throw new Error('Name and email are required');
  }

  const updateData: any = {
    name,
    email,
  };

  if (password && password.trim() !== '') {
    const hashedPassword = await hash(password, 12);
    updateData.password = hashedPassword;
  }

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
    });
  } catch (error) {
    console.error('Failed to update profile:', error);
    // In a real app, handle unique constraint violations (e.g. email already taken)
    redirect('/profile?error=Failed to update profile');
  }

  revalidatePath('/profile');
  redirect('/profile?success=Profile updated successfully');
}