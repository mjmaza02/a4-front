<script setup lang="ts">
import { ref } from "vue";
import { fetchy } from "../../utils/fetchy";

const content = ref("");
const images = ref("");
const emit = defineEmits(["refreshPosts"]);

const createPost = async (content: string, images: string) => {
  try {
    await fetchy("/api/posts", "POST", {
      body: { content, images },
    });
  } catch (_) {
    return;
  }
  emit("refreshPosts");
  emptyForm();
};

const emptyForm = () => {
  content.value = "";
  images.value = "";
};
</script>

<template>
  <form @submit.prevent="createPost(content, images)" class="pure-form">
    <label for="content">Post Contents:</label>
    <textarea id="content" v-model="content" placeholder="Create a post!" required> </textarea>
    <textarea id="images" v-model="images" placeholder="Add a google drive images link!" required> </textarea>
    <button type="submit" class="button-main pure-button">Create Post</button>
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
