// getBotAndLastMessage.ts
import supabase from './supabaseClient';

export interface BotAndLastMessage {
  // Adjust types based on the actual structure returned from your RPC
  bot_id: string;
  bot_name: string;
  last_message: string;
  message_timestamp: string;
}

/**
 * Calls Supabase Edge Function to get bot and last message from a conversation
 * @param conversationId UUID of the conversation
 * @returns An object containing userId and result (bot and last message data)
 */
export async function getBotAndLastMessage(conversationId: string): Promise<{
  userId: string;
  result: BotAndLastMessage;
} | null> {
  try {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(import.meta.env.VITE_GET_BOT_AND_LAST_MESSAGE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ p_conversation_id: conversationId }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch bot and last message');
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching bot and last message:', error);
    return null;
  }
}
