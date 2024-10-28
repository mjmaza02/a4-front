<script setup lang="ts">
import { ref } from "vue";
import { fetchy } from "../../utils/fetchy";

const entry = ref("");
const emit = defineEmits(["refreshList"]);

const createEntry = async (entry: string) => {
  try {
    await fetchy("/api/whitelist/add", "PATCH", {
      body: { entry },
    });
  } catch (_) {
    return;
  }
  emit("refreshList");
  emptyForm();
};

const emptyForm = () => {
  entry.value = "";
};
</script>

<template>
  <form @submit.prevent="createEntry(entry)" class="pure-form">
    <label for="content">Whitelist Entry:</label>
    <textarea id="content" v-model="entry" placeholder="Add a Whitelist Entry!" required> </textarea>
    <button type="submit" class="button-main pure-button">Add</button>
  </form>
</template>

<style scoped>
form {
  background-color: var(--base-bg);
  border-radius: 1em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 1em;
}

textarea {
  font-family: inherit;
  font-size: inherit;
  height: 6em;
  padding: 0.5em;
  border-radius: 4px;
  resize: none;
}
</style>
