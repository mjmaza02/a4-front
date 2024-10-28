<script setup lang="ts">
import CheckListComponent from "@/components/Check/CheckListComponent.vue";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";

const { isLoggedIn } = storeToRefs(useUserStore());
</script>

<template>
  <main>
    <h1>Repeated Images</h1>
    <p>Duplicate images found across the site</p>
    <section>
      <section v-if="isLoggedIn">
        <CheckListComponent />
      </section>
      <h1 v-else>Please login!</h1>
    </section>
  </main>
</template>

<style scoped>
h1,
p {
  text-align: center;
}
</style>
