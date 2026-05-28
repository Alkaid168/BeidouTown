'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentResident } from '@/features/residents/session';
import type { PreparedTarotReading } from './types';
import { finalizeTarotReading, prepareTarotReading } from './readings';

export async function prepareTarotReadingAction(formData: FormData) {
  const resident = await getCurrentResident();
  return prepareTarotReading(
    resident,
    String(formData.get('spreadSlug') ?? ''),
    String(formData.get('question') ?? ''),
  );
}

export async function finalizeTarotReadingAction(prepared: PreparedTarotReading) {
  const resident = await getCurrentResident();
  const result = await finalizeTarotReading(resident, prepared);

  if (result.ok) {
    revalidatePath('/temple');
  }

  return result;
}
