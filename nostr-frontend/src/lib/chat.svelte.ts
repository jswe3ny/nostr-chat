import { SimplePool, type Filter } from 'nostr-tools';
import { finalizeEvent, verifyEvent, generateSecretKey } from 'nostr-tools/pure';
import * as nip44 from 'nostr-tools/nip44';
import * as nip19 from 'nostr-tools/nip19';
import { authState } from './auth.svelte';
import { db } from './db';

export type Message = {
    id: string;
    conversationId: string; 
    text: string;
    isSelf: boolean;
    timestamp: number;
};

export const chatState = $state({
    messages: [] as Message[],
    contacts: [] as Contact[], // <-- ADD THIS LINE
    status: 'Disconnected',
    isListening: false,
    isDbLoaded: false
});

// 1. Add this near your Message type at the top
export type Contact = { npub: string; username: string };


const pool = new SimplePool();
const relays = ['ws://localhost:3334', 'ws://localhost:3335', 'ws://localhost:3336'];
const seenEventIds = new Set<string>();

export async function initializeChat() {
    if (!authState.isAuthenticated || chatState.isDbLoaded) return;
    
    chatState.status = 'Loading database...';
    
    // 1. Pull everything from Dexie into RAM for instant UI rendering
    const storedMessages = await db.messages.orderBy('timestamp').toArray();
    chatState.messages = storedMessages;
    storedMessages.forEach(m => seenEventIds.add(m.id));
    
    chatState.isDbLoaded = true;
    
    // 2. Find the timestamp of the newest message for Delta Sync
    const latestTimestamp = storedMessages.length > 0 
        ? storedMessages[storedMessages.length - 1].timestamp 
        : 0;

    listenForIncoming(latestTimestamp);
}

// Inside src/lib/chat.svelte.ts ONLY

export function listenForIncoming(since: number) {
    if (!authState.pubKeyHex || !authState.privKeyBytes || chatState.isListening) return;
    
    chatState.isListening = true;
    chatState.status = 'Synced & Listening';
    
    const filter = { kinds: [1059], '#p': [authState.pubKeyHex], limit: 100 } as Filter;
    if (since > 0) filter.since = since + 1; 

    pool.subscribeMany(
        relays,
        filter, 
        {
            async onevent(wrapEvent) {
                if (seenEventIds.has(wrapEvent.id)) return;
                seenEventIds.add(wrapEvent.id);

                try {
                    const wrapConvKey = nip44.getConversationKey(authState.privKeyBytes!, wrapEvent.pubkey);
                    const unsealedJson = nip44.decrypt(wrapEvent.content, wrapConvKey);
                    const sealEvent = JSON.parse(unsealedJson); 

                    if (!verifyEvent(sealEvent)) throw new Error("Seal signature invalid");

                    const sealConvKey = nip44.getConversationKey(authState.privKeyBytes!, sealEvent.pubkey);
                    const rumorJson = nip44.decrypt(sealEvent.content, sealConvKey);
                    const rumorEvent = JSON.parse(rumorJson);

                    // --- THE FIX: HANDLE SYNCED "SENT" MESSAGES ---
                    
                    // 1. Did I write this, or did someone else?
                    const isFromMe = sealEvent.pubkey === authState.pubKeyHex;
                    
                    // 2. Figure out which conversation folder this belongs in
                    let conversationPubkeyHex = "";
                    if (isFromMe) {
                        // If I wrote it, the recipient is hidden in the inner Rumor tags
                        const pTag = rumorEvent.tags.find((t: string[]) => t[0] === 'p');
                        if (!pTag) return; // Ignore malformed rumors
                        conversationPubkeyHex = pTag[1];
                    } else {
                        // If someone else wrote it, they are the conversation partner
                        conversationPubkeyHex = sealEvent.pubkey;
                    }

                    const conversationIdNpub = nip19.npubEncode(conversationPubkeyHex);

                    // 3. The Echo Filter: Check if we already optimistically saved this 
                    // (prevents double-bubbles on the laptop you are currently typing on)
                    const isDuplicate = chatState.messages.some(m => 
                        m.timestamp === rumorEvent.created_at && 
                        m.text === rumorEvent.content && 
                        m.isSelf === isFromMe
                    );

                    if (!isDuplicate) {
                        const newMessage: Message = {
                            id: wrapEvent.id,
                            conversationId: conversationIdNpub,
                            text: rumorEvent.content,
                            isSelf: isFromMe, // This correctly colors it Blue or Gray
                            timestamp: rumorEvent.created_at
                        };

                        await db.messages.add(newMessage);
                        chatState.messages = [...chatState.messages, newMessage];
                    }
                } catch (error) {
                    console.error("Decryption failed:", error);
                }
            }
        }
    );
}

export async function sendEncryptedMessage(recipientNpub: string, text: string) {
    if (!text.trim() || !recipientNpub || !authState.privKeyBytes) return;
    
    const decoded = nip19.decode(recipientNpub);
    const recipientHex = decoded.data as string;
    const now = Math.floor(Date.now() / 1000);
    const tempId = crypto.randomUUID();

    const newMessage: Message = {
        id: tempId,
        conversationId: recipientNpub,
        text: text,
        isSelf: true,
        timestamp: now
    };

    // Optimistically update DB and UI so the sender feels zero lag
    await db.messages.add(newMessage);
    chatState.messages = [...chatState.messages, newMessage];

    try {
        // 1. Create the Inner Rumor and Seal (Shared across both wraps)
        const rumor = { kind: 14, content: text, pubkey: authState.pubKeyHex, created_at: now, tags: [['p', recipientHex]] };
        const sealConvKey = nip44.getConversationKey(authState.privKeyBytes, recipientHex);
        const encryptedRumor = nip44.encrypt(JSON.stringify(rumor), sealConvKey);

        const sealTemplate = { kind: 13, content: encryptedRumor, created_at: now, tags: [] };
        const signedSeal = finalizeEvent(sealTemplate, authState.privKeyBytes);

        // --- THE FIX: THE DOUBLE WRAP ---

        // Wrap 1: Addressed to the Recipient
        const ephemeralKey1 = generateSecretKey(); 
        const wrapConvKey1 = nip44.getConversationKey(ephemeralKey1, recipientHex);
        const encryptedSeal1 = nip44.encrypt(JSON.stringify(signedSeal), wrapConvKey1);
        const wrapTemplate1 = { kind: 1059, content: encryptedSeal1, created_at: now, tags: [['p', recipientHex]] };
        const signedWrap1 = finalizeEvent(wrapTemplate1, ephemeralKey1);

        // Wrap 2: Addressed to YOURSELF (The Sync Wrap)
        const ephemeralKey2 = generateSecretKey(); 
        const wrapConvKey2 = nip44.getConversationKey(ephemeralKey2, authState.pubKeyHex);
        const encryptedSeal2 = nip44.encrypt(JSON.stringify(signedSeal), wrapConvKey2);
        const wrapTemplate2 = { kind: 1059, content: encryptedSeal2, created_at: now, tags: [['p', authState.pubKeyHex]] };
        const signedWrap2 = finalizeEvent(wrapTemplate2, ephemeralKey2);

        // Publish both wraps to the network simultaneously
        pool.publish(relays, signedWrap1);
        pool.publish(relays, signedWrap2);

    } catch (err) {
        console.error("Failed to broadcast:", err);
    }
}


export async function saveContactAlias(npub: string, username: string) {
    if (!npub.trim() || !username.trim()) return;
    
    const newContact = { npub, username };
    await db.contacts.put(newContact); // .put() inserts or updates
    
    // Refresh Svelte state
    chatState.contacts = await db.contacts.toArray(); 
}

export function getDisplayName(npub: string): string {
    const contact = chatState.contacts.find(c => c.npub === npub);
    // Return the username if we have one, otherwise fallback to a truncated npub
    return contact ? contact.username : `${npub.slice(0, 12)}...`;
}