export interface AiChatResponse {
    success: boolean;
    message?: string;
    error?: string;
  }
  
export async function sendAiMessage(conversationId: string, messageContent: string, token: string): Promise<AiChatResponse> {
    try {
        const res = await fetch( import.meta.env.VITE_AI_CHAT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ conversationId, messageContent })
        });

        const data = await res.json();
        return data;
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}
