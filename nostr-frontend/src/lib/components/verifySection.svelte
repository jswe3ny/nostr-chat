<script lang="ts">
  import { authState, saveMyIdentityClaim } from '$lib/auth.svelte';
  import { resolveNip05 } from '$lib/identityVerifier';

  let domainInput = $state(authState.myNip05);
  let showSavedStatus = $state(false);
  let isDropdownOpen = $state(false);
  
  let verificationStatus = $state<'none' | 'checking' | 'verified' | 'invalid'>('none');

  $effect(() => {
      if (!authState.myNip05) {
          verificationStatus = 'none';
          return;
      }
      
      verificationStatus = 'checking';
      
      (async () => {
          try {
              const resolvedHex = await resolveNip05(authState.myNip05);
              if (resolvedHex === authState.pubKeyHex) {
                  verificationStatus = 'verified';
              } else {
                  verificationStatus = 'invalid';
              }
          } catch (e) {
              verificationStatus = 'invalid';
          }
      })();
  });


  function handleSaveDomain() {
    try {
        // 1. Try to save the domain
        saveMyIdentityClaim(domainInput);
        // 2. If it succeeds, run your success UI animation
        showSavedStatus = true;
        setTimeout(() => {
            showSavedStatus = false;
            isDropdownOpen = false; 
        }, 1500);
        
    } catch (error:any) {
        // 3. If it fails, halt the success animation and tell the user why
        alert(error.message);
    }
}

</script>

<div class="p-3 bg-gray-100 border-b border-gray-200">
  
  <button 
    class="w-full flex items-center justify-between text-left focus:outline-none group"
    onclick={() => isDropdownOpen = !isDropdownOpen}
  >
    <div class="overflow-hidden pr-2">
      <span class="block text-xs font-bold text-gray-700 uppercase">My Identity</span>

      
      {#if authState.myNip05}
        <div class="flex items-center gap-2 mt-1">
          <span class="text-sm font-mono text-gray-900 truncate">{authState.myNip05}</span>
          
          {#if verificationStatus === 'verified'}
            <span class="text-[10px] bg-green-100 border border-green-300 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 shadow-sm">✓ Active</span>
          {:else if verificationStatus === 'checking'}
            <span class="text-[10px] bg-gray-200 border border-gray-300 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 shadow-sm">Checking</span>
          {:else if verificationStatus === 'invalid'}
            <span class="text-[10px] bg-red-100 border border-red-300 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 shadow-sm">⚠ Invalid</span>
          {/if}
        </div>
      {:else}
        <span class="text-sm text-gray-500 italic mt-1 block">Anonymous (No claim set)</span>
      {/if}
    </div>
    
    <span class="text-gray-400 font-bold transition-transform duration-200 group-hover:text-gray-600 shrink-0 {isDropdownOpen ? 'rotate-180' : ''}">▼</span>
  </button>

  {#if isDropdownOpen}
    <div class="mt-3 pt-3 border-t border-gray-200">
      <div class="flex flex-col gap-2">
        <input 
          type="text" 
          bind:value={domainInput} 
          placeholder="e.g. jack@domain.com" 
          class="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" 
        />
        
        <div class="flex items-center gap-2">
          <button 
            onclick={handleSaveDomain} 
            class="px-3 py-1 bg-gray-800 text-white text-xs font-bold rounded hover:bg-gray-900 transition-colors shadow-sm"
          >
            Save Claim
          </button>
          
          {#if showSavedStatus}
            <span class="text-green-600 text-xs font-bold">✓ Saved</span>
          {/if}
        </div>
        <span class="block text-xs font-bold text-gray-700 uppercase truncate">Pub Key: {authState.npub}</span>

      </div>

    </div>
  {/if}
</div>