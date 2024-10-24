<script setup lang="ts">
import CreateWhitelistEntry from "@/components/Whitelist/CreateWhitelistEntry.vue";
import WhitelistComponent from "@/components/Whitelist/WhitelistComponent.vue";
import { useUserStore } from "@/stores/user";
import { fetchy } from "@/utils/fetchy";
import { storeToRefs } from "pinia";
import { onBeforeMount, ref } from "vue";

const { isLoggedIn } = storeToRefs(useUserStore());
const { currentUsername } = storeToRefs(useUserStore());

const loaded = ref(false);
let lists = ref<Array<Record<string, string>>>([]);
let editing = ref("");

async function getList(author?: string) {
  let query: Record<string, string> = { owner: currentUsername };
  let listResults;
  try {
    listResults = await fetchy("/api/whitelist", "GET");
  } catch {
    return;
  }
  lists.value = listResults.list;
}

function updateEditing(id: string) {
  editing.value = id;
}

onBeforeMount(async () => {
  await getList();
  loaded.value = true;
});
</script>

<template>
  <section v-if="isLoggedIn">
    <h2>Add to Whitelist</h2>
    <CreateWhitelistEntry @refreshList="getList" />
  </section>
  <section class="lists" v-if="loaded && lists.length !== 0">
    <article v-for="entry in lists">
      <WhitelistComponent v-if="editing !== entry" :entry="entry" @refreshList="getList" />
    </article>
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
  flex-direction: column;
  gap: 0.5em;
  padding: 1em;
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
</style>
