<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { chatState, initializeChat, saveContactAlias, getDisplayName,deleteConversation} from '$lib/chat.svelte';
  import * as nip19 from 'nostr-tools/nip19';
  import { normalizeToHexKey } from '$lib/identityVerifier';

  import VerifySection from '$lib/components/verifySection.svelte';


  let { children } = $props();

  let newContactNpub = $state(''); 
  let newContactName = $state('');
  let contacts = $derived([...new Set(chatState.messages.map(m => m.conversationId))]);

  $effect(() => {
    if (!chatState.isDbLoaded) initializeChat();
  });

  async function startNewChat() {
    const input = newContactNpub.trim();
    if (!input) return;

    try {
      // 1. Pass whatever they typed to the adapter
      const hexKey = await normalizeToHexKey(input);
      
      if (!hexKey) {
          alert('Invalid npub or NIP-05 identifier!');
          return;
      }

      // 2. Convert the clean hex back to npub for your router and database
      const targetNpub = nip19.npubEncode(hexKey);

      // 3. Handle the alias saving gracefully
      let aliasToSave = newContactName.trim();
      
      if (!aliasToSave && input.includes('@')) {
          aliasToSave = input;
      }

      if (aliasToSave) {
          saveContactAlias(targetNpub, aliasToSave)
      }

      // 4. Route to the chat exactly like you did before
      goto(`/dashboard/${targetNpub}`);
      
      // Reset inputs
      newContactNpub = '';
      newContactName = '';
    } catch (e) {
      console.error(e);
      alert('An error occurred establishing the chat.');
    }
  }

    // 1. The state variable to track if the list is open or closed
  let isListVisible = $state(true);

  // 2. The function to flip the state
  function toggleList() {
      isListVisible = !isListVisible;
  }
  
  async function handleDeleteChat(event: Event, npub: string) {
    // Stop the click from triggering the <a> link underneath it
    event.preventDefault();
    event.stopPropagation();

    // Confirm before irreversible deletion
    const confirmed = confirm("Delete this conversation? It will be wiped from this device permanently.");
    if (!confirmed) return;

    // Execute the deletion
    await deleteConversation(npub);

    // If they are currently looking at the chat they just deleted, kick them to the dashboard
    if ($page.url.pathname === `/dashboard/${npub}`) {
        goto('/dashboard');
    }
}

</script>
  
<div class="flex flex-col md:grid md:grid-cols-3 gap-3 md:gap-4 flex-grow overflow-hidden mt-4 md:mt-6 h-[85vh] md:h-[700px] w-full max-w-[1400px] mx-auto">
  
  <div class="flex-none bg-white border border-gray-200 rounded shadow-sm flex flex-col overflow-hidden h-fit md:h-full max-h-[50%] md:max-h-full transition-all duration-300 z-10">
    
    <div class="p-3 bg-gray-100 border-b border-gray-200">
      <label class="block text-xs font-bold text-gray-700 mb-1 uppercase">New Chat
      <div class="flex flex-col gap-2">
        <div class="flex gap-2">
          <input 
          type="text" 
          bind:value={newContactNpub} 
          placeholder="npub1 or user@domain.com" 
          class="flex-grow px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500" 
        />
          <button onclick={startNewChat} class="px-3 py-1 bg-gray-800 text-white text-xs font-bold rounded hover:bg-gray-900">+</button>
        </div>
      </div>
    </label>
    </div>
    <div class="flex flex-col">
      <VerifySection />
    </div>
    
    <button 
      onclick={toggleList}
      class="w-full flex justify-between items-center p-2 text-xs font-bold text-gray-600 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors"
    >
      <span class="uppercase">Conversations</span>
      <span>{isListVisible ? '▼' : '▶'}</span>
    </button>
  
    {#if isListVisible}
      <div class="flex-grow overflow-y-auto font-mono transition-all">
        {#if contacts.length === 0}
           <div class="p-4 text-xs text-gray-500 text-center italic">No conversations yet.</div>
        {/if}
        {#each contacts as contactNpub}
          <div class="flex items-center w-full border-b border-gray-100 bg-white">
            
            <a 
              href={`/dashboard/${contactNpub}`}
              class="block flex-grow min-w-0 text-left p-3 text-xs md:text-sm hover:bg-indigo-50 transition-colors {$page.url.pathname === `/dashboard/${contactNpub}` ? 'bg-indigo-100 font-bold border-l-4 border-l-indigo-600' : ''}"
            >
              <div class="truncate text-gray-900 pr-2">{getDisplayName(contactNpub)}</div>
            </a>

            <button 
              onclick={(e) => handleDeleteChat(e, contactNpub)}
              class="flex-shrink-0 px-4 py-3 text-gray-300 hover:text-red-600 transition-colors"
              title="Delete Conversation"
            >
              <span class="text-sm font-bold">✕</span>
            </button>
            
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="md:col-span-2 flex-grow min-h-0 md:h-full bg-white border border-gray-200 rounded shadow-sm flex flex-col relative overflow-hidden">
    {@render children()}
  </div>

</div>