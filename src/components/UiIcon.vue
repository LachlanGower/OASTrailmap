<script setup lang="ts">
defineProps<{name:'swap'|'lock'|'unlock'}>();
</script>
<template><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><template v-if="name==='swap'"><path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4" /></template><template v-else><rect x="5" y="10" width="14" height="11" rx="2" /><path v-if="name==='lock'" d="M8 10V7a4 4 0 0 1 8 0v3" /><path v-else d="M8 10V7a4 4 0 0 1 7.5-2" /><path d="M12 14v3" /></template></svg></template>
