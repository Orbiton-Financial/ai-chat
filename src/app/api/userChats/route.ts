// src/app/api/userChats/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    const { userId, companyId } = await request.json();
    const { data: chats, error } = await supabase
      .from('chats')
      .select('id, title')
      .eq('user_id', userId)
      .eq('company_id', companyId);

    if (error) throw error;
    return NextResponse.json({ chats }, { status: 200 });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}