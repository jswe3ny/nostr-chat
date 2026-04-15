<script lang="ts">
    import { page } from '$app/stores';
    // 1. Make sure saveContactAlias is imported from your chat state
    import { chatState, sendEncryptedMessage, getDisplayName, saveContactAlias } from '$lib/chat.svelte';
  
    let messageText = $state('');
    let chatContainer: HTMLDivElement;
  
    let activeContact = $derived($page.params.contact);
  
    let activeMessages = $derived(
      chatState.messages
        .filter(m => m.conversationId === activeContact)
        .sort((a, b) => a.timestamp - b.timestamp)
    );
  
    // --- NEW: Nickname Editing State ---
    let isEditingName = $state(false);
    let editNameInput = $state('');
  
    function startEditing() {
      const currentName = getDisplayName(activeContact);
      // If the current name is just the raw npub, start with a blank input
      editNameInput = currentName === activeContact ? '' : currentName;
      isEditingName = true;
    }
  
    function saveName() {
      if (editNameInput.trim()) {
        // Saves it to Dexie and updates Svelte's global state
        saveContactAlias(activeContact, editNameInput.trim());
      }
      isEditingName = false;
    }
    // ------------------------------------
  
    $effect(() => {
      if (activeMessages.length && chatContainer) {
        setTimeout(() => {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 10);
      }
    });
  
    function handleSend() {
      if (!messageText.trim()) return;
      sendEncryptedMessage(activeContact, messageText);
      messageText = '';
    }
  </script>
  
  <div class="flex flex-col h-full bg-gray-50 font-mono">
    
    <div class="bg-white p-4 border-b border-gray-200 text-sm font-bold text-gray-800 flex justify-between items-center shadow-sm z-10">
      
      <div class="flex items-center gap-2">
        <span class="text-gray-500 font-normal">Talking to:</span>
        
        {#if isEditingName}
          <div class="flex items-center gap-2">
            <input 
              type="text" 
              bind:value={editNameInput} 
              onkeydown={(e) => e.key === 'Enter' && saveName()} 
              class="px-2 py-1 border border-gray-300 rounded text-xs font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40" 
              placeholder="Enter nickname..." 
              autofocus 
            />
            <button onclick={saveName} class="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors">Save</button>
            <button onclick={() => isEditingName = false} class="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300 transition-colors">Cancel</button>
          </div>
        {:else}
          <span class="text-indigo-600 truncate max-w-[200px] inline-block align-bottom">{getDisplayName(activeContact)}</span>
          <button onclick={startEditing} class="text-gray-400 hover:text-indigo-600 ml-1 transition-colors" title="Set Nickname">✏️</button>
        {/if}
      </div>
  
      <span class="text-xs text-gray-400 font-normal">NIP-17 Secure Chat</span>
    </div>
  
    <div bind:this={chatContainer} class="flex flex-col flex-grow p-4 overflow-y-auto space-y-4 scroll-smooth">
      {#if activeMessages.length === 0}
        <div class="flex flex-col items-center justify-center h-full text-gray-400 text-sm italic">
          <span class="text-3xl mb-2 opacity-50">📭</span>
          No history found. Send a message to open the secure channel.
        </div>
      {/if}
      
      {#each activeMessages as msg (msg.id)}
        <div class="flex w-full {msg.isSelf ? 'justify-end' : 'justify-start'}">
          <div class="w-fit max-w-[60%] min-w-0 p-3 rounded-xl shadow-sm {msg.isSelf ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}">
            <div class="text-sm leading-relaxed whitespace-pre-wrap break-all">{msg.text}</div>
            <div class="text-[10px] mt-1 {msg.isSelf ? 'text-indigo-200 text-right' : 'text-gray-400 text-right'}">
              {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      {/each}
    </div>
  
    <div class="bg-white p-3 border-t border-gray-200">
      <div class="flex gap-2 items-end">
        <textarea 
          bind:value={messageText} 
          onkeydown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
              }
          }}
          placeholder="Type an encrypted message..." 
          class="flex-grow px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none overflow-hidden max-h-32 min-h-[44px]"
          rows="1"
        ></textarea>
        <button onclick={handleSend} class="px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl transition-colors h-[44px]">Send</button>
      </div>
      <div class="text-center mt-2">
         <span class="text-[10px] text-gray-400">End-to-end encrypted • Press Enter to send</span>
      </div>
    </div>
  </div>