<script setup lang="ts">
// import { useUserStore } from "@/stores/user";
// import { storeToRefs } from "pinia";
// import { fetchy } from "../../utils/fetchy";

const props = defineProps(["user", "src"]);
</script>

<template>
  <div class="entry">
    <p>
      <b>{{ props.user }}</b>
    </p>
    <iframe :src="props.src" width="400" height="300"></iframe>
  </div>
</template>

<style scoped>
p {
  margin: 0em;
}

.author {
  font-weight: bold;
  font-size: 1.2em;
}

menu {
  list-style-type: none;
  display: flex;
  flex-direction: row;
  gap: 1em;
  padding: 0;
  margin: 0;
}

.timestamp {
  display: flex;
  justify-content: flex-end;
  font-size: 0.9em;
  font-style: italic;
}

.base {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.base article:only-child {
  margin-left: auto;
}

.entry {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
</style>
