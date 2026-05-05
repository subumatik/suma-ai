import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { email: user.email },
  });
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const { id } = await params;

  const notification = await prisma.notification.updateMany({
    where: { id, user_id: profile.id },
    data: { is_read: true },
  });

  return NextResponse.json({ success: true, count: notification.count });
}
