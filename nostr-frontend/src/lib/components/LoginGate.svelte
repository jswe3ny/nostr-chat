<script lang="ts">
    import { loginWithNsec, loginWithNpub, generateNewAccount } from '$lib/auth.svelte';
  
    // Svelte 5 state runes for form inputs
    let inputNpub = $state('');
    let inputNsec = $state('');
  
    // Triggers State 3: Full Decryption Access
    function handleFullLogin() {
      if (inputNsec.trim()) {
        loginWithNsec(inputNsec.trim());
      }
    }
  
    // Triggers State 2: Ciphertext Observer Mode
    function handlePublicOnlyLogin() {
      if (inputNpub.trim()) {
        loginWithNpub(inputNpub.trim());
      }
    }
  </script>
  
  <div class="max-w-xl mx-auto mt-16 w-full space-y-12 font-mono flex flex-col items-center">
    
    <div class="text-center bg-white border border-gray-200 p-8 rounded-lg shadow-sm w-full">
      <div class="text-4xl mb-4">✨</div>
      <h2 class="text-xl font-bold mb-1 text-gray-800">Generate New Keypair</h2>
      <p class="text-sm text-gray-500 mb-6">Create a brand new identity for secure messaging.</p>
      <button 
        onclick={generateNewAccount} 
        class="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full transition-colors text-sm shadow-sm"
      >
        ✨ Create Fresh Nostr Identity
      </button>
    </div>
  
    <div class="flex items-center w-full max-w-sm">
      <div class="flex-grow border-t border-gray-300"></div>
      <span class="px-4 text-gray-400 text-xs font-bold uppercase tracking-widest">or login with keys</span>
      <div class="flex-grow border-t border-gray-300"></div>
    </div>
  
    <div class="bg-white border border-gray-200 p-8 rounded-lg shadow-sm w-full">
      <h2 class="text-xl font-bold mb-1 text-gray-800">Nostr Identity Portal</h2>
      <p class="text-sm text-gray-500 mb-8 border-b pb-4">Provide your keys to unlock the network.</p>
      
      <div class="space-y-6">
        <div>
          <label class="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider" for="npub_input">
            Public Key (npub) - Share this with friends
          </label>
          <input 
            id="npub_input"
            type="text" 
            bind:value={inputNpub} 
            placeholder="npub1..." 
            class="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
          />
        </div>
  
        <div class="relative">
          <label class="block text-xs font-bold text-red-400 mb-1 uppercase tracking-wider" for="nsec_input">
            Private Key (nsec) - Keep this 100% Secret
          </label>
          
          <input 
            id="nsec_input"
            type="password" 
            bind:value={inputNsec} 
            placeholder="nsec1..." 
            class="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 text-sm pr-12 transition-colors {inputNpub.trim() ? '' : 'bg-gray-100 cursor-not-allowed opacity-70'}"
            disabled={!inputNpub.trim()}
          />
          
          <div class="absolute right-4 top-1/2 mt-3 -translate-y-1/2 text-gray-400">
              {#if inputNpub.trim() && inputNsec.trim()}
                  🔓
              {:else if inputNpub.trim()}
                  🔑
              {:else}
                  🔒
              {/if}
          </div>
        </div>
  
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-200">
          
          <button 
            onclick={handlePublicOnlyLogin} 
            class="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-full transition-colors text-sm {inputNpub.trim() ? '' : 'opacity-50 cursor-not-allowed'}"
            disabled={!inputNpub.trim()}
          >
            🎧 Observer Mode (Ciphertext Only)
          </button>
  
          <button 
            onclick={handleFullLogin} 
            class="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full transition-colors text-sm {inputNpub.trim() && inputNsec.trim() ? '' : 'opacity-50 cursor-not-allowed'}"
            disabled={!inputNpub.trim() || !inputNsec.trim()}
          >
            Full Decryption Access
          </button>
        </div>
      </div>
    </div>
  </div>