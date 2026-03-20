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
    return data.character as Character;
  } catch (err) {
    console.error('Error fetching character:', err);
    return null;
  }
}

// import supabase from './supabaseClient';

// export interface Character {
//   id: string;
//   name: string;
//   prompt: string;
//   userId: string;
//   createdAt: string;
//   updatedAt: string;
//   private: boolean;
// }

// /**
//  * Fetch a character by ID from the Supabase edge function.
//  * Uses anon key (no user auth required)
//  */
// export async function getCharacterById(characterId: string): Promise<Character | null> {
//   try {
//     const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
//     const endpoint = import.meta.env.VITE_GET_CHARACTER_BY_ID;

//     if (!anonKey) {
//       throw new Error('Missing VITE_SUPABASE_ANON_KEY');
//     }

//     if (!endpoint) {
//       throw new Error('Missing VITE_GET_CHARACTER_BY_ID');
//     }

//     const res = await fetch(endpoint, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${anonKey}`, // ✅ matches your working curl
//       },
//       body: JSON.stringify({ characterId }),
//     });

//     if (!res.ok) {
//       let errMsg = 'Failed to fetch character';
//       try {
//         const err = await res.json();
//         errMsg = err.error || errMsg;
//       } catch {
//         // ignore JSON parse errors
//       }
//       throw new Error(errMsg);
//     }

//     const data = await res.json();
//     return data.character as Character;
//   } catch (err) {
//     console.error('Error fetching character:', err);
//     return null;
//   }
// }
