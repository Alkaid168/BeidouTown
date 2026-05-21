import { NextResponse } from 'next/server';
import { getCurrentResident } from '@/features/residents/session';
import { listRecentTavernMessages, listTavernMessagesAfter } from '@/features/tavern/messages';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const after = url.searchParams.get('after');
  const resident = await getCurrentResident();

  if (after) {
    const afterDate = new Date(after);

    if (Number.isNaN(afterDate.getTime())) {
      return NextResponse.json({ messages: [] });
    }

    const messages = await listTavernMessagesAfter(afterDate, resident);
    return NextResponse.json({ messages });
  }

  const messages = await listRecentTavernMessages(resident);
  return NextResponse.json({ messages });
}
