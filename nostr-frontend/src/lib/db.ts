import Dexie, { type Table } from 'dexie';
// 1. Make sure to import the Contact type alongside Message!
import type { Message, Contact } from './chat.svelte'; 

export class ChatDatabase extends Dexie {
  messages!: Table<Message, string>; 
  
  // 2. THIS IS THE MISSING LINE: Tell TypeScript the contacts table exists
  contacts!: Table<Contact, string>; 

  constructor() {
    super('NostrChatDB');
    
    // 3. Make sure this says version(2) so Dexie knows to create the new table
    this.version(2).stores({
      messages: 'id, conversationId, timestamp',
      contacts: 'npub' 
    });
  }
}

export const db = new ChatDatabase();