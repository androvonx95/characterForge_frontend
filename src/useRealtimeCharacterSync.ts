import { useEffect } from 'react';
import supabase from './supabaseClient';

type Character = {
  id: string;
  name: string;
  private: boolean;
  prompt?: string;
  createdAt?: string;
};

type DeleteHistory = {
  id: string;
  entityId: string;
  entityType: string;
  deletedBy: string;
  createdAt?: string;
};

export function useRealtimeCharacterSync(
  token: string | null,
  setPublicCharacters: React.Dispatch<React.SetStateAction<Character[]>>
) {
  useEffect(() => {
    if (!token) return;

    const characterChannel = supabase
      .channel('public-characters')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Character',
        },
        (payload) => {
          const newChar = payload.new as Character;
          const oldChar = payload.old as Character;

          const isPublicChange =
            (payload.eventType === 'INSERT' && newChar?.private === false) ||
            (payload.eventType === 'UPDATE' &&
              (newChar?.private === false || oldChar?.private === false)) ||
            (payload.eventType === 'DELETE' && oldChar?.private === false);

          if (!isPublicChange) return;

          setPublicCharacters((prev) => {
            switch (payload.eventType) {
              case 'INSERT':
                return [...prev, newChar];
              case 'UPDATE':
                return prev.map((char) => (char.id === newChar.id ? newChar : char));
              case 'DELETE':
                return prev.filter((char) => char.id !== oldChar.id);
              default:
                return prev;
            }
          });
        }
      )
      .subscribe();

    const deleteHistoryChannel = supabase
      .channel('delete-history')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'DeleteHistory',
        },
        (payload) => {
          const newEntry = payload.new as DeleteHistory;
          const oldEntry = payload.old as DeleteHistory;

          const isCharDeleted =
            newEntry?.entityType === 'character' || oldEntry?.entityType === 'character';

          if (!isCharDeleted) return;

          const deletedId = newEntry?.entityId || oldEntry?.entityId;

          setPublicCharacters((prev) => prev.filter((char) => char.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(characterChannel);
      supabase.removeChannel(deleteHistoryChannel);
    };
  }, [token, setPublicCharacters]);
}
