// src/app/api/loadChat/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    const { chatId } = await request.json(); // Get the chatId from the request body

    if (!chatId) {
      return NextResponse.json({ error: 'chatId is required' }, { status: 400 });
    }

    // Fetch messages for the selected chat from the database
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true }); // Assuming messages have a 'created_at' timestamp for ordering

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no messages are found, return a default response
    if (!messages || messages.length === 0) {
      return NextResponse.json({ chatId, messages: [] }, { status: 200 });
    }

    // Return the chat messages for the selected chat
    return NextResponse.json({ chatId, messages }, { status: 200 });
  } catch (error) {
    console.error("Error in loadChat API:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
