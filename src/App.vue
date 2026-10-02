<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <RouterLink class="brand" to="/expenses">Fair Share</RouterLink>
      <nav aria-label="Main navigation">
        <RouterLink to="/expenses">Expenses</RouterLink>
        <RouterLink to="/owes">Owes</RouterLink>
      </nav>
    </header>
    <RouterView />
  </div>
</template>
