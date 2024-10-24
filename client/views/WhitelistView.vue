<script setup lang="ts">
import WhitelistListComponent from "@/components/Whitelist/WhitelistListComponent.vue";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";

const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());
</script>

<template>
  <main>
    <h1>Whitelist</h1>
    <section>
      <section v-if="isLoggedIn">
        <WhitelistListComponent />
      </section>
      <h1 v-else>Please login!</h1>
    </section>
  </main>
</template>

<style scoped>
h1 {
  text-align: center;
}
</style>
