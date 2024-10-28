<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { fetchy } from "@/utils/fetchy";
import { storeToRefs } from "pinia";
import { onBeforeMount, ref } from "vue";
import CheckComponent from "./CheckComponent.vue";

const { isLoggedIn } = storeToRefs(useUserStore());

const loaded = ref(false);
let checks = ref<Array<string>>([]);
let lists = ref<Array<string>>([]);
let checked = ref<string[]>([]);

async function getChecks() {
  let listResults;
  try {
    listResults = await fetchy("/api/checkIm", "GET");
  } catch {
    return;
  }
  checks.value = listResults.list.filter((e: string[]) => !lists.value.includes(e[0]));
}

async function updateTrackers(vals: string[]) {
  for (const target of vals) {
    try {
      await fetchy(`/api/track/${target}`, "PATCH");
      await getChecks();
    } catch {
      return;
    }
  }
  checked.value = [];
}

async function getList() {
  let listResults;
  try {
    listResults = await fetchy("/api/whitelist", "GET");
  } catch {
    return;
  }
  lists.value = listResults.list;
}

onBeforeMount(async () => {
  await getList();
  await getChecks();
  loaded.value = true;
});
</script>

<template>
  <section v-if="isLoggedIn">
    <h2>Checklist</h2>
  </section>
  <section class="lists" v-if="loaded && checks.length !== 0">
    <form @submit.prevent="updateTrackers(checked)">
      <article v-for="(entry, index) in checks">
        <CheckComponent :user="entry[0]" :src="entry[1]" @refreshList="getChecks" />
        <input type="checkbox" :id="index.toString()" :value="entry[2]" v-model="checked" />
      </article>
      <section class="button-menu">
        <button class="pure-button button-error" @click="() => (checked = [])">Cancel</button>
        <button type="submit" class="button-main pure-button">Report</button>
      </section>
    </form>
  </section>
  <p v-else-if="loaded">No lists found</p>
  <p v-else>Loading...</p>
</template>

<style scoped>
section {
  display: flex;
  flex-direction: column;
  gap: 1em;
}

section,
p,
.row {
  margin: 0 auto;
  max-width: 60em;
}

article {
  background-color: var(--base-bg);
  border-radius: 1em;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: start;
  gap: 0.5em;
  padding: 1em;
  margin: 0 0 1em 0;
}

.lists {
  padding: 1em;
}

.row {
  display: flex;
  justify-content: space-between;
  margin: 0 auto;
  max-width: 60em;
}

.button-menu {
  flex-direction: row-reverse;
}
</style>
