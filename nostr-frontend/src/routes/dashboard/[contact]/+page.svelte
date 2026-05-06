<script lang="ts">
    import { page } from '$app/stores';
    // 1. Make sure saveContactAlias is imported from your chat state
    import { chatState, sendEncryptedMessage, getDisplayName, saveContactAlias, executeManualVerification } from '$lib/chat.svelte';
    
let isVerifying = $state(false);
let verificationError = $state(""); // New state to catch errors
// Evaluates to true ONLY if every relay is currently disconnected
let isNetworkDead = $derived(Object.values(chatState.relayStatus).every(status => status === false));
async function handleVerifyClick() {
  if (!activeContact?.claimedDomain) {
    alert("This user hasn't claimed a domain to verify.");
    return;
  }

  // 2. Start loading
  isVerifying = true;
  verificationError = "";

  try {
    const delay = new Promise(resolve => setTimeout(resolve, 1000));

    await Promise.all([
        delay,
        executeManualVerification(activeNpub, activeContact.claimedDomain)
      ]);

  } catch (error: any) {
    alert("Verification Failed: " + error.message);
  } finally {
    // 3. Stop loading regardless of success or failure
    isVerifying = false;
  }
}
    let messageText = $state('');
    let chatContainer: HTMLDivElement;
  


    let activeNpub = $derived($page.params.contact || '');

    let activeContact = $derived(
      chatState.contacts.find(c => c.npub === activeNpub) || {
          npub: activeNpub,
          username: activeNpub, 
          isVerified: false
      }
  );
    let activeMessages = $derived(
      chatState.messages
        .filter(m => m.conversationId === activeNpub)
        .sort((a, b) => a.timestamp - b.timestamp)
    );
  
    let isEditingName = $state(false);
    let editNameInput = $state('');
  
    function startEditing() {
      const currentName = getDisplayName(activeNpub);
      isEditingName = true;
    }
  
    function saveName() {
      if (editNameInput.trim()) {
        if (!activeContact) return;
        // Saves it to Dexie and updates Svelte's global state
        saveContactAlias(activeContact.npub, editNameInput.trim());
      }
      isEditingName = false;
    }
  
    $effect(() => {
      if (activeMessages.length && chatContainer) {
        setTimeout(() => {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 10);
      }
    });
  
    function handleSend() {
      if (!messageText.trim() || !activeContact) return;
      sendEncryptedMessage(activeContact.npub, messageText);
      messageText = '';
    }
  </script>
  
  <div class="flex flex-col h-full bg-gray-50 font-mono">
    
    <div class="bg-white p-3 md:p-4 border-b border-gray-200 text-sm font-bold text-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0 shadow-sm z-10">
      
      <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
        <span class="text-gray-500 font-normal text-xs md:text-sm">Talking to:</span>
        
        {#if isEditingName}
          <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
            <input 
              type="text" 
              bind:value={editNameInput} 
              onkeydown={(e) => e.key === 'Enter' && saveName()} 
              class="px-2 py-1 border border-gray-300 rounded text-xs font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-40" 
              placeholder="Enter nickname..." 
            />
            <div class="flex gap-2">
              <button onclick={saveName} class="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors">Save</button>
              <button onclick={() => isEditingName = false} class="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300 transition-colors">Cancel</button>
            </div>
          </div>
        {:else}
          <span class="text-indigo-600 truncate max-w-[150px] sm:max-w-[200px] inline-block align-bottom">{ activeContact?.username || "no username yet"}</span>
          <button onclick={startEditing} class="text-gray-400 hover:text-indigo-600 ml-1 transition-colors text-xs" title="Set Nickname">Edit</button>
        {/if}
      </div>
  
      <div class="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto border-t md:border-t-0 border-gray-100 pt-2 md:pt-0">
  
        {#if isVerifying}
          <span class="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] md:text-xs font-bold animate-pulse">
            Attempting verification...
          </span>
      
        {:else if verificationError}
          <span class="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-[10px] md:text-xs font-medium shadow-sm truncate max-w-[150px]">
            Fail: {verificationError}
          </span>
          <button 
            onclick={handleVerifyClick}
            class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] md:text-xs font-bold transition-colors"
          >
            Retry
          </button>
      
        {:else if activeContact?.lastVerified}
          <span class="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-[10px] md:text-xs font-bold shadow-sm whitespace-nowrap">
            Last Verified: {Math.floor((Date.now() - activeContact.lastVerified) / (1000 * 60 * 60))} hours ago
          </span>
          <button 
            onclick={handleVerifyClick}
            class="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] md:text-xs font-bold transition-colors shadow-sm whitespace-nowrap"
          >
            Re-Verify
          </button>
      
        {:else}
          <span class="px-2 py-1 bg-gray-100 text-gray-500 border border-gray-200 rounded text-[10px] md:text-xs font-medium shadow-sm whitespace-nowrap">
            Unverified
          </span>
          <button 
            onclick={handleVerifyClick}
            class="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] md:text-xs font-bold transition-colors shadow-sm whitespace-nowrap"
          >
            Verify
          </button>
        {/if}
        
      </div>

    </div>
  
    <div bind:this={chatContainer} class="flex flex-col flex-grow p-3 md:p-4 overflow-y-auto space-y-4 scroll-smooth">
      {#if activeMessages.length === 0}
        <div class="flex flex-col items-center justify-center h-full text-gray-400 text-sm italic px-4 text-center">
          <span class="text-3xl mb-2 opacity-50">📭</span>
          No history found. Send a message to open the secure channel.
        </div>
      {/if}
      
      {#each activeMessages as msg (msg.id)}
        <div class="flex w-full {msg.isSelf ? 'justify-end' : 'justify-start'}">
          <div class="w-fit max-w-[85%] md:max-w-[60%] min-w-0 p-2 md:p-3 rounded-xl shadow-sm {msg.isSelf ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}">
            <div class="text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-all">{msg.text}</div>
            <div class="text-[9px] md:text-[10px] mt-1 {msg.isSelf ? 'text-indigo-200 text-right' : 'text-gray-400 text-right'}">
              {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      {/each}
    </div>
  
    <div class="bg-white p-2 md:p-3 border-t border-gray-200">
      <div class="flex gap-2 items-end">
        <textarea 
  bind:value={messageText} 
  disabled={isNetworkDead}
  onkeydown={(e) => {
    // Extra safety: prevent Enter key from firing if network is dead
    if (e.key === 'Enter' && !e.shiftKey && !isNetworkDead) {
      e.preventDefault();
      handleSend();
    }
  }}
  placeholder={isNetworkDead ? "Waiting for network connection..." : "Type an encrypted message..."} 
  class="flex-grow px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs md:text-sm resize-none overflow-hidden max-h-32 min-h-[40px] md:min-h-[44px] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
  rows="1"
></textarea>

<button 
  onclick={handleSend} 
  disabled={isNetworkDead}
  class="px-4 py-2 md:px-6 md:py-3 bg-gray-800 hover:bg-gray-900 text-white text-sm md:text-base font-bold rounded-xl transition-colors h-[40px] md:h-[44px] disabled:bg-gray-400 disabled:cursor-not-allowed"
>
  Send
</button>
      </div>
    </div>
  </div>

