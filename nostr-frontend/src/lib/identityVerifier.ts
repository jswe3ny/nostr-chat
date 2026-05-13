import { nip19 } from 'nostr-tools';


export async function resolveNip05(identifier: string): Promise<string> {
    const [name, domain] = identifier.split('@');
    
    if (!name || !domain) {
        throw new Error("Invalid NIP-05 format. Must be formatted as name@domain.com");
    }

    let response;
    try {
        response = await fetch(`https://${domain}/.well-known/nostr.json?name=${name}`);
    } catch (error) {
        throw new Error(`Network Error: Could not reach ${domain}. The server might be down or blocking CORS.`);
    }
    
    const data = await response.json();
    const hexPubKey = data.names?.[name];
    
    if (typeof hexPubKey === 'string' && hexPubKey.length === 64) {
        return hexPubKey;
    }
    
    throw new Error(`Not Found: ${domain} does not have a NIP-05 record for "${name}".`);
}


export async function normalizeToHexKey(input: string): Promise<string | null> {
    const cleanInput = input.trim();

    // Condition 1: Input is already a 64-character hex key
    if (/^[0-9a-fA-F]{64}$/.test(cleanInput)) {
        return cleanInput;
    }

    // Condition 2: Input is a NIP-05 identifier
    if (cleanInput.includes('@')) {
        return await resolveNip05(cleanInput);
    }

    // Condition 3: Input is an encoded npub
    if (cleanInput.startsWith('npub1')) {
        try {
            const decoded = nip19.decode(cleanInput);
            if (decoded.type === 'npub') {
                return decoded.data as string;
            }
        } catch (err) {
            console.error("Invalid npub format.");
            return null;
        }
    }

    // Unrecognized format
    return null;
}


