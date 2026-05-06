<script lang="ts">
    import { onMount } from 'svelte';
    import { authState, restoreSession, logout } from '$lib/auth.svelte';
    import { chatState } from '$lib/chat.svelte';
  
    import LoginGate from '$lib/components/LoginGate.svelte';
    import CiphertextView from '$lib/components/CiphertextView.svelte';
    import DecryptedApp from '$lib/components/DecryptedTextView.svelte';
  
    // This snippet holds your [contact]/+page.svelte content
    let { children } = $props();
  
    onMount(() => {
      restoreSession();
    });
  </script>
  
  <div class="max-w-6xl mx-auto p-4 h-screen flex flex-col font-mono">
    <nav class="flex justify-between items-center pb-4 border-b border-gray-300">
      <div class="flex items-center gap-4">
        <h1 class="text-2xl font-bold text-gray-900">Secure Dashboard</h1>
        
        {#if authState.loginMode === 'private'}
        {#if authState.loginMode === 'private'}
        <div class="flex items-center gap-2">
          {#each Object.entries(chatState.relayStatus) as [url, isConnected]}
            <span 
              class="text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1.5 transition-colors
              {isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}"
              title={url}
            >
              <span class="w-1.5 h-1.5 rounded-full {isConnected ? 'bg-green-500' : 'bg-red-500'}"></span>
              {url.split(':').pop()}
            </span>
          {/each}
        </div>
      {/if}
        {:else if authState.loginMode === 'public'}
          <span class="text-xs font-bold px-2 py-1 bg-red-100 text-red-700 rounded-full flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Raw Stream
          </span>
        {/if}
      </div>
  
      <div class="flex gap-4 items-center">
        {#if authState.loginMode !== 'none'}
          <button onclick={logout} class="text-red-600 hover:underline text-sm font-bold">Logout</button>
        {/if}
      </div>
    </nav>
  
    {#if authState.loginMode === 'none'}
      <LoginGate />
    {:else if authState.loginMode === 'public'}
      <CiphertextView />
    {:else if authState.loginMode === 'private'}
      <DecryptedApp>
        {@render children()}
      </DecryptedApp>
    {/if}
  </div>