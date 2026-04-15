<script lang="ts">
  import { authState } from '$lib/auth.svelte';
</script>

<div class="flex flex-col h-full bg-white">
  <div class="bg-gray-50 p-6 border-b border-gray-200">
    <h3 class="text-lg font-bold text-gray-800 mb-4">Your Identity</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <span class="block text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Public Key (npub) - Share this</span>
        <div class="bg-white border border-gray-200 p-2 rounded text-xs text-gray-800 break-all select-all font-mono cursor-pointer">{authState.npub}</div>
      </div>
      <div>
        <span class="block text-xs text-red-400 font-bold uppercase tracking-wider mb-1">Private Key (nsec) - Keep Secret</span>
        <div class="bg-red-50 border border-red-200 p-2 rounded text-xs text-red-700 break-all select-all font-mono cursor-pointer">{authState.nsec}</div>
      </div>
    </div>
  </div>

  <div class="flex-grow flex flex-col items-center justify-center text-center p-8">
    <div class="text-5xl mb-4 opacity-50">💬</div>
    <h2 class="text-xl font-bold text-gray-800 mb-2">Inbox Ready</h2>
    <p class="text-sm text-gray-500 max-w-md">
      Select a conversation from the sidebar or start a new encrypted chat using someone's public key (npub).
    </p>
  </div>
</div>