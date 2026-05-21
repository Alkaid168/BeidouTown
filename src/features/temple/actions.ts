'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentResident } from '@/features/residents/session';
import { createTarotReading } from './readings';

export async function createTarotReadingAction(formData: FormData) {
  const resident = await getCurrentResident();
  const result = await createTarotReading(resident, String(formData.get('question') ?? ''));
  revalidatePath('/temple');
  return result;
}
