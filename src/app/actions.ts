'use server';

import { createOrder, markFollowed, markSent, assignGifter, addGifterSlot, refundOrder, deleteOrder, invalidOrder, banUser, unbanUser, createSkin, updateSkin } from '@/lib/order';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession, logout } from '@/lib/auth';

export async function logoutAction() {
  await logout();
  redirect('/');
}

export async function submitOrder(formData: FormData) {
  const skinId = formData.get('skinId') as string;
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const buyerIGN = formData.get('ign') as string;
  const buyerMLID = formData.get('mlid') as string;
  const buyerServer = formData.get('server') as string;

  if (!skinId || !name || !email || !buyerIGN || !buyerMLID || !buyerServer) {
    throw new Error('Missing required fields');
  }

  const order = await createOrder({
    skinId,
    name,
    email,
    buyerIGN,
    buyerMLID,
    buyerServer,
  });

  redirect(`/order/track/${order.id}`);
}

export async function actionMarkFollowed(orderId: string) {
  const session = await getSession();
  if (!session || (session.role !== 'GIFTER' && session.role !== 'ADMIN')) {
      throw new Error('Unauthorized');
  }

  await markFollowed(orderId);
  revalidatePath('/dashboard/gifter');
  revalidatePath(`/order/track/${orderId}`);
}

export async function actionMarkSent(orderId: string) {
  const session = await getSession();
  if (!session || (session.role !== 'GIFTER' && session.role !== 'ADMIN')) {
      throw new Error('Unauthorized');
  }

  await markSent(orderId);
  revalidatePath('/dashboard/gifter');
  revalidatePath(`/order/track/${orderId}`);
}

export async function actionAssignGifter(orderId: string, gifterId?: string) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized');
  }

  try {
      await assignGifter(orderId, gifterId);
      revalidatePath('/dashboard/admin');
      revalidatePath(`/order/track/${orderId}`);
  } catch (e) {
      console.error(e);
      // In a real app we'd return an error state
  }
}

import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function actionCreateGifter(formData: FormData) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!name || !email || !password) {
        throw new Error('Missing fields');
    }

    const hashedPassword = await hash(password, 12);

    try {
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'GIFTER',
            }
        });
        revalidatePath('/dashboard/admin');
    } catch (error) {
        console.error('Failed to create gifter:', error);
        throw new Error('Failed to create gifter');
    }
}

export async function actionCreateSkin(formData: FormData) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    const name = formData.get('name') as string;
    const priceStr = formData.get('price') as string;
    const price = parseInt(priceStr, 10);
    const imageUrl = formData.get('imageUrl') as string;
    const displayPrice = formData.get('displayPrice') as string;
    const description = formData.get('description') as string;

    if (!name || isNaN(price)) {
        throw new Error('Missing or invalid fields');
    }

    await createSkin({ name, price, imageUrl, displayPrice, description });
    revalidatePath('/dashboard/admin');
    revalidatePath('/');
}

export async function actionUpdateSkin(formData: FormData) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const priceStr = formData.get('price') as string;
    const price = parseInt(priceStr, 10);
    const imageUrl = formData.get('imageUrl') as string;
    const displayPrice = formData.get('displayPrice') as string;
    const description = formData.get('description') as string;

    if (!id || !name || isNaN(price)) {
        throw new Error('Missing or invalid fields');
    }

    await updateSkin(id, { name, price, imageUrl, displayPrice, description });
    revalidatePath('/dashboard/admin');
    revalidatePath('/');
}

export async function actionRefundOrder(orderId: string) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized');
    
    await refundOrder(orderId);
    revalidatePath('/dashboard/admin');
}

export async function actionInvalidOrder(orderId: string) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized');
    
    await invalidOrder(orderId);
    revalidatePath('/dashboard/admin');
}

export async function actionDeleteOrder(orderId: string) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized');
    
    await deleteOrder(orderId);
    revalidatePath('/dashboard/admin');
}

export async function actionBanUser(formData: FormData) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized');
    
    const userId = formData.get('userId') as string;
    const reason = formData.get('reason') as string;

    if (!userId || !reason) throw new Error('Missing fields');

    await banUser(userId, reason);
    revalidatePath('/dashboard/admin');
}

export async function actionUnbanUser(userId: string) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized');
    
    await unbanUser(userId);
    revalidatePath('/dashboard/admin');
}

export async function actionAddMySlot(formData: FormData) {
    const session = await getSession();
    if (!session || session.role !== 'GIFTER') {
        throw new Error('Unauthorized');
    }

    const skinId = formData.get('skinId') as string;
    const quantityStr = formData.get('quantity') as string;
    const quantity = parseInt(quantityStr || '1', 10);
    
    if (!skinId) return;

    await addGifterSlot(skinId, session.userId, quantity);
    revalidatePath('/dashboard/gifter');
    revalidatePath('/dashboard/admin'); // Update admin view
    revalidatePath('/'); // Update availability on homepage
}

export async function actionAddSlot(formData: FormData) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    const skinId = formData.get('skinId') as string;
    const gifterId = formData.get('gifterId') as string;
    const quantityStr = formData.get('quantity') as string;
    const quantity = parseInt(quantityStr || '1', 10);
    
    if (!skinId || !gifterId) return;

    await addGifterSlot(skinId, gifterId, quantity);
    revalidatePath('/dashboard/admin');
    revalidatePath('/'); // Update availability on homepage
}
