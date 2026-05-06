import Dexie, { type Table } from 'dexie';
import type { Message, Contact } from './chat.svelte'; 

export class ChatDatabase extends Dexie {
  messages!: Table<Message, string>; 
  
  contacts!: Table<Contact, string>; 

  constructor() {
    super('NostrChatDB');
    
    this.version(2).stores({
      messages: 'id, conversationId, timestamp',
      contacts: 'npub' 
    });
  }
}

export const db = new ChatDatabase();