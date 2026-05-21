'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentResident } from '@/features/residents/session';
import { createTavernMessage, moderateTavernMessage, withdrawTavernMessage } from './messages';

export async function sendTavernMessageAction(formData: FormData) {
  const resident = await getCurrentResident();
  const result = await createTavernMessage(resident, String(formData.get('content') ?? ''));
  revalidatePath('/tavern');
  return result;
}

export async function withdrawTavernMessageAction(formData: FormData) {
  const resident = await getCurrentResident();
  const result = await withdrawTavernMessage(resident, String(formData.get('messageId') ?? ''));
  revalidatePath('/tavern');
  return result;
}

export async function moderateTavernMessageAction(formData: FormData) {
  const resident = await getCurrentResident();
  const result = await moderateTavernMessage(resident, String(formData.get('messageId') ?? ''));
  revalidatePath('/tavern');
  return result;
}
