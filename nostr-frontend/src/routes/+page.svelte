<script lang="ts">
    // In SvelteKit, standard anchor tags (<a>) handle client-side routing automatically.
  </script>
  
  <div class="font-mono min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-gray-800">
    <div class="max-w-3xl w-full bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center">
      
      <!-- Hero Section -->
      <div class="mb-2">
        <span class="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full tracking-wider mb-4 border border-indigo-200">
          Nostr Chat App
        </span>
      </div>
      <h1 class="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
        Decentralized Relay Messenger
      </h1>
    
  
      <!-- Architecture Abstract -->
      <div class="text-left bg-gray-50 p-6 rounded border border-gray-200 mb-10 shadow-inner">
        <h3 class="text-sm font-bold text-gray-800 uppercase tracking-wide mb-5 border-b border-gray-300 pb-2">
          System Architecture & Protocols
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-sm text-gray-600 leading-relaxed">
          
          <div>
            <span class="font-bold text-gray-800 block mb-1">
              <span class="text-indigo-600 mr-1">❖</span> Encrypted Payloads (NIP-17 & NIP-44)
            </span>
            Direct messages utilize XChaCha20 encryption structured through the Rumor, Seal, and Wrap paradigm. This guarantees both end-to-end forward secrecy and cryptographic authenticity for the recipient.
          </div>
      
          <div>
            <span class="font-bold text-gray-800 block mb-1">
              <span class="text-indigo-600 mr-1">❖</span> Metadata Obfuscation (NIP-59)
            </span>
            Outer message envelopes are broadcast using randomly generated ephemeral keys. Network observers can only see an encrypted blob routed to a pubkey; the sender's identity and communication graph remain strictly invisible.
          </div>
      
          <div>
            <span class="font-bold text-gray-800 block mb-1">
              <span class="text-indigo-600 mr-1">❖</span> Trustless Identity (NIP-05)
            </span>
            Identity relies on cryptographic keypairs rather than centralized authorities. The client features an active verification system that queries DNS records to validate user domain claims (e.g., alias@domain.com) and prevent impersonation.
          </div>
      
          <div>
            <span class="font-bold text-gray-800 block mb-1">
              <span class="text-indigo-600 mr-1">❖</span> Fault-Tolerant Relay Cluster
            </span>
            The network layer subscribes and broadcasts concurrently across a localized cluster of <strong class="text-indigo-600 font-medium">nostr-rs-relay</strong> nodes via secure WebSockets (WSS), ensuring high availability and no single point of failure.
          </div>
      
          <div class="md:col-span-2 pt-3 border-t border-gray-200">
            <span class="font-bold text-gray-800 block mb-1">
              <span class="text-red-500 mr-1">❖</span> Volatile Local Storage
            </span>
            The remote infrastructure is strictly zero-knowledge. Network events are synced to the browser's IndexedDB for instant UI rendering. Upon logout, all private keys, contacts, and message histories are explicitly purged from the device.
          </div>
      
        </div>
      </div>
  
      <!-- Navigation / Call to Action -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        <a 
          href="/dashboard" 
          class="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow transition-colors flex items-center justify-center gap-2"
        >
          <span>⚡</span> Enter Dashboard
        </a>
      </div>
  
      <!-- Tech Stack Footer -->
      <div class="border-t border-gray-200 pt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-500 font-semibold uppercase tracking-wider">
        <span>Svelte 5</span>
        <span class="hidden sm:inline">•</span>
        <span>Nostr-Tools</span>
        <span class="hidden sm:inline">•</span>
        <span>Rust / SQLite</span>
        <span class="hidden sm:inline">•</span>
        <span>XChaCha20</span>
      </div>
  
    </div>
  </div>