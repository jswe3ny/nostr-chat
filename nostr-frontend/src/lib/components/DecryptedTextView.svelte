<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { chatState, initializeChat, saveContactAlias, getDisplayName } from '$lib/chat.svelte';
    import * as nip19 from 'nostr-tools/nip19';
  
    // Accept the active chat page from the layout orchestrator
    let { children } = $props();
  
    let newContactNpub = $state('');
    let newContactName = $state('');
    let contacts = $derived([...new Set(chatState.messages.map(m => m.conversationId))]);
  
    // Boot the local-first engine
    $effect(() => {
      if (!chatState.isDbLoaded) initializeChat();
    });
  
    function startNewChat() {
      if (!newContactNpub.trim()) return;
      try {
        if (newContactName.trim()) saveContactAlias(newContactNpub.trim(), newContactName.trim());
        goto(`/dashboard/${newContactNpub.trim()}`);
        newContactNpub = '';
        newContactName = '';
      } catch (e) {
        alert('Invalid npub format!');
      }
    }
  </script>
  
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 flex-grow overflow-hidden mt-6 h-[700px]">
    <div class="bg-white border border-gray-200 rounded shadow-sm flex flex-col overflow-hidden">
      <div class="p-3 bg-gray-100 border-b border-gray-200">
        <label class="block text-xs font-bold text-gray-700 mb-1 uppercase">New Chat</label>
        <div class="flex flex-col gap-2">
          <input type="text" bind:value={newContactName} placeholder="Alias (e.g. Alice)" class="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500" />
          <div class="flex gap-2">
            <input type="text" bind:value={newContactNpub} placeholder="npub1..." class="flex-grow px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500" />
            <button onclick={startNewChat} class="px-3 py-1 bg-gray-800 text-white text-xs font-bold rounded hover:bg-gray-900">+</button>
          </div>
        </div>
      </div>
      
      <div class="flex-grow overflow-y-auto font-mono">
        {#if contacts.length === 0}
           <div class="p-4 text-xs text-gray-500 text-center italic">No conversations yet.</div>
        {/if}
        {#each contacts as contactNpub}
          <a 
            href={`/dashboard/${contactNpub}`}
            class="block w-full text-left p-3 text-sm border-b border-gray-100 hover:bg-indigo-50 transition-colors {$page.url.pathname === `/dashboard/${contactNpub}` ? 'bg-indigo-100 font-bold border-l-4 border-l-indigo-600' : ''}"
          >
            <div class="truncate text-gray-900">{getDisplayName(contactNpub)}</div>
          </a>
        {/each}
      </div>
    </div>
  
    <div class="md:col-span-3 bg-white border border-gray-200 rounded shadow-sm flex flex-col relative overflow-hidden">
      {@render children()}
    </div>
  </div>