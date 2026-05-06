import { SimplePool, type Filter } from 'nostr-tools';
import { finalizeEvent, verifyEvent, generateSecretKey } from 'nostr-tools/pure';
import * as nip44 from 'nostr-tools/nip44';
import * as nip19 from 'nostr-tools/nip19';
import { authState } from './auth.svelte';
import { db } from './db';
import { resolveNip05 } from './identityVerifier';

export type Message = {
    id: string;
    conversationId: string; 
    text: string;
    isSelf: boolean;
    timestamp: number;
};

export const chatState = $state({
    messages: [] as Message[],
    contacts: [] as Contact[], 
    status: 'Disconnected',
    isListening: false,
    isDbLoaded: false,
    relayStatus: {} as Record<string, boolean>
});

export type Contact = { 
    npub: string; 
    username: string; 
    claimedDomain?: string; 
    isVerified: boolean; 
    lastVerified?: number;
};

const pool = new SimplePool();
const relays = ['wss://relay1.jacksweeny.com', 'wss://relay2.jacksweeny.com', 'wss://relay3.jacksweeny.com'];
const seenEventIds = new Set<string>();

export async function initializeChat() {
    if (!authState.isAuthenticated || chatState.isDbLoaded) return;
    
    chatState.status = 'Loading database...';
    
    // 1. Pull everything from Dexie into RAM for instant UI rendering
    const storedMessages = await db.messages.orderBy('timestamp').toArray();
    chatState.messages = storedMessages;
    storedMessages.forEach(m => seenEventIds.add(m.id));
    
    chatState.isDbLoaded = true;

    chatState.contacts = await db.contacts.toArray();
    
    // 2. Find the timestamp of the newest message for Delta Sync
    const latestTimestamp = storedMessages.length > 0 
        ? storedMessages[storedMessages.length - 1].timestamp 
        : 0;

    // const latestTimestamp = await getLatestTimestamp();
    console.log("Latest Timestamp: " + latestTimestamp)
    listenForIncoming(latestTimestamp);
}



export function listenForIncoming(since: number) {
    if (!authState.pubKeyHex || !authState.privKeyBytes || chatState.isListening) return;
    
    

    chatState.isListening = true;
    chatState.status = 'Synced & Listening';
 
    
    relays.forEach(url => {
        pool.ensureRelay(url).then(relay => {
            chatState.relayStatus[url] = true; // Mark Green
            
            // If it drops, mark Red
            relay.onclose = () => { chatState.relayStatus[url] = false; };
            // relay.onerror = () => { chatState.relayStatus[url] = false; };
        }).catch(() => {
            chatState.relayStatus[url] = false; // Mark Red on failure
        });
    });


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

                    
                    // 1. Verify I am sender
                    const isFromMe = sealEvent.pubkey === authState.pubKeyHex;

                    let conversationPubkeyHex = "";
                    if (isFromMe) {
                        const pTag = rumorEvent.tags.find((t: string[]) => t[0] === 'p');
                        if (!pTag) return; 
                        conversationPubkeyHex = pTag[1];
                    } else {
                        conversationPubkeyHex = sealEvent.pubkey;
                        const conversationIdNpub = nip19.npubEncode(conversationPubkeyHex);

                        // --- NEW: EXTRACT THE CLAIM ---
                        const nip05Tag = rumorEvent.tags.find((t: string[]) => t[0] === 'nip05');
                        const claimedDomain = nip05Tag ? nip05Tag[1] : undefined;

                        // Save as unverified contact
                        registerIncomingContact(conversationIdNpub, claimedDomain);
                    }
                    const conversationIdNpub = nip19.npubEncode(conversationPubkeyHex);

                    // 3. Check if message is already saved
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
                            isSelf: isFromMe,
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

export async function sendEncryptedMessage(recipientNpub: string, text: string, myNip05?: string) {
    if (!text.trim() || !recipientNpub || !authState.privKeyBytes) return;
    
    const decoded = nip19.decode(recipientNpub);
    const recipientHex = decoded.data as string;
    const now = Math.floor(Date.now() / 1000);


    try {
        // 1. Create the Shared Inner Rumor
        const rumorTags: string[][] = [['p', recipientHex]];
        if (authState.myNip05) {
            rumorTags.push(['nip05', authState.myNip05]);
        }

        const rumor = { 
            kind: 14, 
            content: text, 
            pubkey: authState.pubKeyHex, 
            created_at: now, 
            tags: rumorTags 
        };        
        const rumorJson = JSON.stringify(rumor);

        // --- SEAL 1: Locked for the Recipient ---
        const sealConvKey1 = nip44.getConversationKey(authState.privKeyBytes, recipientHex);
        const encryptedRumor1 = nip44.encrypt(rumorJson, sealConvKey1);
        const sealTemplate1 = { kind: 13, content: encryptedRumor1, created_at: now, tags: [] };
        const signedSeal1 = finalizeEvent(sealTemplate1, authState.privKeyBytes);

        // --- SEAL 2: Locked for Yourself (BCC Sync) ---
        const sealConvKey2 = nip44.getConversationKey(authState.privKeyBytes, authState.pubKeyHex);
        const encryptedRumor2 = nip44.encrypt(rumorJson, sealConvKey2);
        const sealTemplate2 = { kind: 13, content: encryptedRumor2, created_at: now, tags: [] };
        const signedSeal2 = finalizeEvent(sealTemplate2, authState.privKeyBytes);

        // --- THE DOUBLE WRAP ---

        // Wrap 1: Addressed to the Recipient
        const ephemeralKey1 = generateSecretKey(); 
        const wrapConvKey1 = nip44.getConversationKey(ephemeralKey1, recipientHex);
        const encryptedSeal1 = nip44.encrypt(JSON.stringify(signedSeal1), wrapConvKey1);
        const wrapTemplate1 = { kind: 1059, content: encryptedSeal1, created_at: now, tags: [['p', recipientHex]] };
        const signedWrap1 = finalizeEvent(wrapTemplate1, ephemeralKey1);

        // Wrap 2: Addressed to YOURSELF
        const ephemeralKey2 = generateSecretKey(); 
        const wrapConvKey2 = nip44.getConversationKey(ephemeralKey2, authState.pubKeyHex);
        const encryptedSeal2 = nip44.encrypt(JSON.stringify(signedSeal2), wrapConvKey2);
        const wrapTemplate2 = { kind: 1059, content: encryptedSeal2, created_at: now, tags: [['p', authState.pubKeyHex]] };
        const signedWrap2 = finalizeEvent(wrapTemplate2, ephemeralKey2);

        // --- NEW: SAVE USING THE REAL CRYPTO ID ---
        const newMessage: Message = {
            id: signedWrap2.id, 
            conversationId: recipientNpub,
            text: text,
            isSelf: true,
            timestamp: now
        };

        await db.messages.add(newMessage);
        chatState.messages = [...chatState.messages, newMessage];
        
        // Ignore duplicate message
        seenEventIds.add(signedWrap2.id); 

        // Publish both wraps to the network simultaneously
        pool.publish(relays, signedWrap1);
        pool.publish(relays, signedWrap2);

    } catch (err) {
        console.error("Failed to broadcast:", err);
    }
}

export async function saveContactAlias(npub: string, username: string) {
    if (!npub.trim() || !username.trim()) return;
    
    // Fetch them from the database to see if they already exist
    const existing = await db.contacts.get(npub);
    
    const updatedContact: Contact = { 
        npub, 
        username,
        claimedDomain: existing?.claimedDomain,
        isVerified: existing?.isVerified || false 
    };
    
    await db.contacts.put(updatedContact);
    chatState.contacts = await db.contacts.toArray(); 
}

export function getDisplayName(npub: string | undefined) {
    if (!npub) return;
    const contact = chatState.contacts.find(c => c.npub === npub);
    return contact ? contact.username : npub;
}



export async function registerIncomingContact(npub: string, claimedDomain?: string) {
    const existing = await db.contacts.get(npub);

    const domainChanged = claimedDomain && existing?.claimedDomain !== claimedDomain;
    
    if (existing?.lastVerified && !domainChanged) return;

    const updatedContact: Contact = {
        npub,
        username: existing?.username || npub,
        claimedDomain: claimedDomain || existing?.claimedDomain,
        isVerified: false,
        lastVerified: domainChanged ? undefined : existing?.lastVerified
    };

    await db.contacts.put(updatedContact);
    chatState.contacts = await db.contacts.toArray();
}

export async function executeManualVerification(npub: string, claimedDomain: string): Promise<boolean> {
    const decoded = nip19.decode(npub);
    const targetHex = decoded.data as string;

    // If this fails, it instantly stops and throws the error to the UI
    const verifiedHex = await resolveNip05(claimedDomain);

    if (verifiedHex === targetHex) {
        const verifiedContact: Contact = {
            npub,
            username: claimedDomain, 
            claimedDomain,
            isVerified: true,
            lastVerified: Date.now()
        };
        
        await db.contacts.put(verifiedContact);
        chatState.contacts = await db.contacts.toArray();
        return true;
    } 

    // If the hexes don't match, wipe the cache safely
    const existing = await db.contacts.get(npub);
    if (existing) {
        existing.lastVerified = undefined;
        await db.contacts.put(existing);
        chatState.contacts = await db.contacts.toArray();
    }

    // Throw the final imposter error to the UI (No console.warn!)
    throw new Error("Security Alert: The public key registered on that domain does NOT match this user's public key.");
}

export async function deleteConversation(npub: string) {
    if (!npub) return;

    // 1. Find all message IDs associated with this conversation
    const messagesToDelete = chatState.messages.filter(m => m.conversationId === npub);
    const idsToDelete = messagesToDelete.map(m => m.id);

    // 2. Wipe them from the Dexie hard drive
    await db.messages.bulkDelete(idsToDelete);

    // 3. Remove them from the live Svelte state
    chatState.messages = chatState.messages.filter(m => m.conversationId !== npub);

    // 4. (Optional) Wipe the contact info so they are completely forgotten
    await db.contacts.delete(npub);
    chatState.contacts = chatState.contacts.filter(c => c.npub !== npub);
}