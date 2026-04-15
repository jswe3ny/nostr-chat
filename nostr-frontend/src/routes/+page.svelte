<script lang="ts">
    // In SvelteKit, standard anchor tags (<a>) handle client-side routing automatically.
  </script>
  
  <div class="font-mono min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-gray-800">
    <div class="max-w-3xl w-full bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center">
      
      <!-- Hero Section -->
      <div class="mb-2">
        <span class="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full tracking-wider mb-4 border border-indigo-200">
          CS CAPSTONE PROJECT
        </span>
      </div>
      <h1 class="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
        Decentralized Relay Messenger
      </h1>
      <h2 class="text-lg sm:text-xl font-semibold text-gray-600 mb-8">
        Privacy-First, Zero-Knowledge Real-Time Routing
      </h2>
  
      <!-- Architecture Abstract -->
      <div class="text-left bg-gray-50 p-6 rounded border border-gray-200 mb-10 shadow-inner">
        <h3 class="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 border-b border-gray-300 pb-2">
          System Architecture
        </h3>
        <p class="text-sm text-gray-600 leading-relaxed">
          This application demonstrates fault-tolerant network synchronization across a localized cluster of <strong class="text-indigo-600">nostr-rs-relay</strong> nodes. 
          It implements the <strong class="text-indigo-600">NIP-17</strong> protocol to achieve metadata-shielded direct messaging. 
          Payloads are wrapped via XChaCha20 encryption (NIP-44) and broadcasted using randomly generated ephemeral keys to guarantee absolute sender anonymity.
        </p>
      </div>
  
      <!-- Navigation / Call to Action -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        <a 
          href="/login" 
          class="px-8 py-3 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded shadow transition-colors flex items-center justify-center gap-2"
        >
          <span>🔑</span> Manage Identity
        </a>
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