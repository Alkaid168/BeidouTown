'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentResident } from '@/features/residents/session';
import { createTreeholePost, createTreeholeReply, moderateTreeholePost, withdrawTreeholePost } from './posts';

export async function publishTreeholePostAction(formData: FormData) {
  const resident = await getCurrentResident();
  const result = await createTreeholePost(
    resident,
    String(formData.get('title') ?? ''),
    String(formData.get('content') ?? ''),
  );
  revalidatePath('/treehole');
  revalidatePath('/treehole/mine');
  return result;
}

export async function publishTreeholeReplyAction(formData: FormData) {
  const resident = await getCurrentResident();
  const postId = String(formData.get('postId') ?? '');
  const result = await createTreeholeReply(resident, postId, String(formData.get('content') ?? ''));
  revalidatePath('/treehole');
  revalidatePath(`/treehole/${postId}`);
  revalidatePath('/treehole/messages');
  return result;
}

export async function withdrawTreeholePostAction(formData: FormData) {
  const resident = await getCurrentResident();
  const result = await withdrawTreeholePost(resident, String(formData.get('postId') ?? ''));
  revalidatePath('/treehole');
  revalidatePath('/treehole/mine');
  return result;
}

export async function moderateTreeholePostAction(formData: FormData) {
  const resident = await getCurrentResident();
  const result = await moderateTreeholePost(resident, String(formData.get('postId') ?? ''));
  revalidatePath('/treehole');
  revalidatePath('/treehole/mine');
  return result;
}
