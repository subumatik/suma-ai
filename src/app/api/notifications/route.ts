import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { email: user.email },
  });
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const notifications = await prisma.notification.findMany({
    where: { user_id: profile.id },
    orderBy: { created_at: 'desc' },
    take: 20,
  });

  return NextResponse.json(notifications);
}
