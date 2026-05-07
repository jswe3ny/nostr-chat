<script lang="ts">
    import { SimplePool } from 'nostr-tools';
    import { authState } from '$lib/auth.svelte';
  
    let rawEvents = $state<any[]>([]);
    let status = $state('Connecting to cluster...');
  
    $effect(() => {
      const pool = new SimplePool();
      const relays = ['wss://relay1.jacksweeny.com', 'wss://relay2.jacksweeny.com', 'wss://relay3.jacksweeny.com'];
      status = 'Listening for encrypted NIP-1059 payloads...';
  
      const sub = pool.subscribeMany(
        relays,
        { kinds: [1059], '#p': [authState.pubKeyHex], limit: 15 },
        {
          onevent(event) {
            rawEvents = [event, ...rawEvents];
          }
        }
      );
  
      // CLEANUP: Destroys connection when user leaves this view
      return () => {
        sub.close();
        pool.close(relays);
      };
    });
  </script>
  
  <div class="bg-gray-900 rounded-lg p-4 font-mono text-green-400 h-[600px] flex flex-col shadow-inner mt-6">
    <div class="border-b border-green-800 pb-2 mb-4 flex justify-between items-center">
      <span class="text-xs font-bold uppercase tracking-widest text-green-500">Ciphertext Observer Active</span>
      <span class="text-xs animate-pulse">● {status}</span>
    </div>
  
    <div class="flex-grow overflow-y-auto space-y-4 pr-2">
      {#if rawEvents.length === 0}
        <div class="text-green-800 text-sm italic">Waiting for incoming secure payloads...</div>
      {/if}
  
      {#each rawEvents as evt (evt.id)}
      <div class="bg-black p-3 rounded border border-green-900 overflow-x-auto text-xs leading-relaxed break-all shadow-md">
        <span class="text-gray-500">{"{"}</span><br/>
        &nbsp;&nbsp;<span class="text-blue-400">"id"</span>: <span class="text-yellow-300">"{evt.id}"</span>,<br/>
        &nbsp;&nbsp;<span class="text-blue-400">"pubkey"</span>: <span class="text-yellow-300">"{evt.pubkey}"</span>,<br/>
        &nbsp;&nbsp;<span class="text-blue-400">"created_at"</span>: <span class="text-purple-400">{evt.created_at}</span>,<br/>
        &nbsp;&nbsp;<span class="text-blue-400">"kind"</span>: <span class="text-purple-400">1059</span>,<br/>
        
        &nbsp;&nbsp;<span class="text-blue-400">"tags"</span>: [<br/>
        {#each evt.tags as tag}
          &nbsp;&nbsp;&nbsp;&nbsp;[<span class="text-yellow-300">"{tag[0]}"</span>, <span class="text-yellow-300">"{tag[1]}"</span>]<br/>
        {/each}
        &nbsp;&nbsp;],<br/>
        &nbsp;&nbsp;<span class="text-blue-400">"content"</span>: <span class="text-green-300">"{evt.content}"</span><br/>
        <span class="text-gray-500">{"}"}</span>
      </div>
    {/each}
    </div>
  </div>