// getCharacter.ts
import supabase from './supabaseClient'; // your existing Supabase client

export interface Character {
  id: string;
  name: string;
  prompt: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  private: boolean;
}

/**
 * Fetch a character by ID from the Supabase edge function.
 * @param characterId UUID of the character
 * @returns Character object or null if not found
 */
export async function getCharacterById(characterId: string): Promise<Character | null> {
  try {
    const tokenData = await supabase.auth.getSession();
    const token = tokenData.data.session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(
      import.meta.env.VITE_GET_CHARACTER_BY_ID,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ characterId }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch character');
    }

    const data = await res.json();
    return data as Character;
  } catch (err) {
    console.error('Error fetching character:', err);
    return null;
  }
}
