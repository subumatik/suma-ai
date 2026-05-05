import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let userId = user.id;
    
    // Try to get profile ID if it exists and uses email mapping
    if (user.email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user.email)
        .single();
        
      if (profile) {
        userId = profile.id;
      }
    }

    // Fetch notifications
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Notifications fetch error:', error.message);
      return NextResponse.json([]); // Return empty to prevent 500 spam
    }

    return NextResponse.json(notifications || []);
  } catch (error) {
    console.error('Notifications route error:', error);
    return NextResponse.json([]); // Safe fallback
  }
}
