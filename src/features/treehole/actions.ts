'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentResident } from '@/features/residents/session';
import { createTreeholePost, moderateTreeholePost, withdrawTreeholePost } from './posts';

export async function publishTreeholePostAction(formData: FormData) {
  const resident = await getCurrentResident();
  const result = await createTreeholePost(resident, String(formData.get('content') ?? ''));
  revalidatePath('/treehole');
  return result;
}

export async function withdrawTreeholePostAction(formData: FormData) {
  const resident = await getCurrentResident();
  const result = await withdrawTreeholePost(resident, String(formData.get('postId') ?? ''));
  revalidatePath('/treehole');
  return result;
}

export async function moderateTreeholePostAction(formData: FormData) {
  const resident = await getCurrentResident();
  const result = await moderateTreeholePost(resident, String(formData.get('postId') ?? ''));
  revalidatePath('/treehole');
  return result;
}
