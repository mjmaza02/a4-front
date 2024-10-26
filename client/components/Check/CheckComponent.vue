<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { fetchy } from "../../utils/fetchy";

const props = defineProps(["user", "src"]);
const emit = defineEmits(["refreshList"]);
const { currentUsername } = storeToRefs(useUserStore());

const deleteEntry = async () => {
  try {
    await fetchy(`/api/whitelist/remove`, "PATCH", {
      body: { entry: props.user }
    });
  } catch {
    return;
  }
  emit("refreshList");
};
</script>

<template>
  <p><b>{{ props.user }}</b></p>
  <p>{{ props.src }}</p>
  <div class="base">
    <menu>
      <!-- <li><button class="button-error btn-small pure-button" @click="deleteEntry">Delete</button></li> -->
    </menu>
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
</style>
