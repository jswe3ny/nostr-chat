import { generateSecretKey, getPublicKey } from 'nostr-tools/pure';
import * as nip19 from 'nostr-tools/nip19';

// 1. The Global State Machine
export const authState = $state({
  isAuthenticated: false,
  loginMode: 'none' as 'none' | 'public' | 'private', // THE 3 STATES
  npub: '',
  nsec: '',
  pubKeyHex: '',
  privKeyBytes: null as Uint8Array | null,
});

// 2. State 2 Trigger: Public Key Only (Observer Mode)
export function loginWithNpub(npub: string) {
  try {
    const decoded = nip19.decode(npub);
    if (decoded.type !== 'npub') throw new Error("Invalid npub");
    
    authState.pubKeyHex = decoded.data as string;
    authState.npub = npub;
    authState.privKeyBytes = null;
    authState.nsec = '';
    authState.isAuthenticated = true;
    
    // Set the state machine to trigger the CiphertextView component
    authState.loginMode = 'public'; 
  } catch (err) {
    console.error(err);
    alert("Invalid npub provided.");
  }
}

// 3. State 3 Trigger: Private Key (Full Access Mode)
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

// 4. Generate a brand new identity
export function generateNewAccount() {
  const privKey = generateSecretKey();
  const nsec = nip19.nsecEncode(privKey);
  
  // Instantly log them in with the new key (Sets mode to 'private')
  loginWithNsec(nsec); 
}

// 5. Restore session on page refresh
export function restoreSession() {
  const savedNsec = localStorage.getItem('nostr_nsec');
  if (savedNsec) {
    // If they have a saved key, bypass the login gate and go straight to State 3
    loginWithNsec(savedNsec);
  }
}

// 6. State 1 Trigger: Logout & Memory Wipe
export function logout() {
  authState.isAuthenticated = false;
  
  // Set the state machine to trigger the LoginGate component
  authState.loginMode = 'none'; 
  
  authState.npub = '';
  authState.nsec = '';
  authState.pubKeyHex = '';
  authState.privKeyBytes = null;
  
  localStorage.removeItem('nostr_nsec');
  
  // Force SvelteKit to drop whatever dynamic chat page the user was looking at
  window.location.href = '/dashboard';
}