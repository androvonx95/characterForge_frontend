export async function deleteMessages(
    conversationId: string,
    idx: number,
    token: string
  ) {
    try {

        console.log('Deleting message', { conversationId, idx, token });
        const res = await fetch(import.meta.env.VITE_DELETE_MESSAGES, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ conversationId, idx }),
        });
    
        let result = null;
        try {
            result = await res.json(); // attempt parse
        } catch {
            result = { success: false, error: 'Server returned no JSON' };
        }
    
        return result;
    } catch (err: unknown) {
        console.error('Error deleting message:', err);
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
  