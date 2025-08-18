export interface Message {
    id?: string;
    role: 'user' | 'character';
    content: string;
    createdAt?: string;
    idx?: number;
    conversationId?: string;
  }
  