import { generateSecretKey, getPublicKey } from 'nostr-tools/pure';
import * as nip19 from 'nostr-tools/nip19';

import {db} from '$lib/db';

const storedNip05 = typeof window !== 'undefined' ? localStorage.getItem('myNip05') || "" : "";
export const authState = $state({
  isAuthenticated: false,
  loginMode: 'none' as 'none' | 'public' | 'private', // THE 3 STATES
  npub: '',
  nsec: '',
  pubKeyHex: '',
  privKeyBytes: null as Uint8Array | null,
  myNip05: storedNip05
});

// 2. State 2 Trigger: Public Key Only 
export function loginWithNpub(npub: string) {
  try {
    const decoded = nip19.decode(npub);
    if (decoded.type !== 'npub') throw new Error("Invalid npub");
    
    authState.pubKeyHex = decoded.data as string;
    authState.npub = npub;
    authState.privKeyBytes = null;
    authState.nsec = '';
    authState.isAuthenticated = true;
    
    authState.loginMode = 'public'; 
  } catch (err) {
    console.error(err);
    alert("Invalid npub provided.");
  }
}

// 3. State 3 Trigger: Private Key 
export function loginWithNsec(nsec: string) {
  try {
    const decoded = nip19.decode(nsec);
    if (decoded.type !== 'nsec') throw new Error("Invalid nsec");
    
    const privKey = decoded.data as Uint8Array;
    const pubKey = getPublicKey(privKey);
    
    authState.privKeyBytes = privKey;
    authState.pubKeyHex = pubKey;
    authState.nsec = nsec;
    authState.npub = nip19.npubEncode(pubKey);
    authState.isAuthenticated = true;
    
    // Set the state machine to trigger the DecryptedApp component
    authState.loginMode = 'private'; 
    
    // Persist session to hard drive
    localStorage.setItem('nostr_nsec', nsec);
  } catch (err) {
    console.error(err);
    alert("Invalid nsec provided.");
  }
}

export function generateNewAccount() {
  const privKey = generateSecretKey();
  const nsec = nip19.nsecEncode(privKey);
  loginWithNsec(nsec); 
}

// 5. Restore session on page refresh
export function restoreSession() {
  const savedNsec = localStorage.getItem('nostr_nsec');
  if (savedNsec) {
    loginWithNsec(savedNsec);
  }
}

// 6. State 1 Trigger: Logout & Memory Wipe
export async function logout() {
  try {
    // the IndexedDB database from the browser
    await db.delete(); 
  } catch (err) {
    console.error("Failed to wipe local database:", err);
  }
  authState.isAuthenticated = false;
  
  authState.loginMode = 'none'; 
  
  authState.npub = '';
  authState.nsec = '';
  authState.pubKeyHex = '';
  authState.privKeyBytes = null;
  
  localStorage.removeItem('nostr_nsec');
  localStorage.removeItem('myNip05');
  
  window.location.href = '/dashboard';
}

export function saveMyIdentityClaim(domain: string) {
    const cleanDomain = domain.trim();
    
    // 1. Basic validation
    if (!cleanDomain) {
        throw new Error("Domain claim cannot be empty.");
    }
    if (!cleanDomain.includes('@')) {
        throw new Error("Invalid format. Please use the format name@domain.com");
    }

    // 2. Update RAM/State
    authState.myNip05 = cleanDomain;
    
    // 3. Try to save to hard drive
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem('myNip05', cleanDomain);
        } catch (err) {
            console.error("Storage failure:", err);
            throw new Error("Failed to save to browser storage. Your browser's privacy settings might be blocking it.");
        }
    }
}