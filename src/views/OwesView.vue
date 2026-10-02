<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  expensesService,
  type Owe,
  type PaginationMeta,
} from "../services/expenses";
import { usersService, type UserOption } from "../services/users";

const pageSize = 20;
const emptyMeta: PaginationMeta = { page: 1, limit: pageSize, total: 0, totalPages: 1 };

const owes = ref<Owe[]>([]);
const users = ref<UserOption[]>([]);
const meta = ref<PaginationMeta>(emptyMeta);
const loading = ref(false);
const error = ref("");
const filters = reactive({ userId: "" });

const rangeStart = computed(() =>
  meta.value.total === 0 ? 0 : (meta.value.page - 1) * meta.value.limit + 1,
);
const rangeEnd = computed(() => Math.min(meta.value.page * meta.value.limit, meta.value.total));

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat().format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(date));
}

async function loadOwes(page = meta.value.page) {
  loading.value = true;
  error.value = "";

  try {
    const result = await expensesService.listOwes({ ...filters, page, limit: pageSize });
    owes.value = result.data;
    meta.value = result.meta;
  } catch (requestError) {
    error.value = messageFrom(requestError, "Unable to load balances.");
  } finally {
    loading.value = false;
  }
}

async function loadUsers() {
  try {
    users.value = await usersService.getAll();
  } catch (requestError) {
    error.value = messageFrom(requestError, "Unable to load users.");
  }
}

function clearFilters() {
  filters.userId = "";
  void loadOwes(1);
}

onMounted(() => {
  void loadOwes(1);
  void loadUsers();
});
</script>

<template>
  <main class="workspace">
    <header class="page-header">
      <div>
        <p class="eyebrow">Shared balances</p>
        <h1>Owes</h1>
        <p class="subtitle">A live view of outstanding balances between people.</p>
      </div>
    </header>

    <section class="filter-panel compact-panel" aria-label="Owe filters">
      <div>
        <p class="section-kicker">Narrow the list</p>
        <h2>Person</h2>
      </div>
      <div class="compact-filter-actions">
        <label class="field">
          <span>Show balances involving</span>
          <select v-model="filters.userId" @change="loadOwes(1)">
            <option value="">Everyone</option>
            <option v-for="user in users" :key="user.id" :value="String(user.id)">
              {{ user.label }}
            </option>
          </select>
        </label>
        <button v-if="filters.userId" class="button button-quiet" type="button" @click="clearFilters">
          Clear
        </button>
      </div>
    </section>

    <section class="results-section" aria-live="polite">
      <div class="results-heading">
        <div>
          <p class="section-kicker">Outstanding balances</p>
          <h2>{{ meta.total }} balance{{ meta.total === 1 ? "" : "s" }}</h2>
        </div>
        <span v-if="meta.total" class="results-summary">
          Showing {{ rangeStart }}–{{ rangeEnd }} of {{ meta.total }}
        </span>
      </div>

      <p v-if="error" class="notice" role="alert">{{ error }}</p>

      <div class="table-shell">
        <table>
          <thead>
            <tr>
              <th>Owed to</th>
              <th>Owed by</th>
              <th class="amount-cell">Balance</th>
              <th>Since</th>
            </tr>
          </thead>
          <tbody v-if="owes.length">
            <tr v-for="owe in owes" :key="owe.id">
              <td><strong>{{ owe.fromUser.fullName }}</strong></td>
              <td>{{ owe.toUser.fullName }}</td>
              <td
                class="amount-cell amount"
                :class="{
                  'amount-positive': owe.balance > 0,
                  'amount-negative': owe.balance < 0,
                }"
              >
                {{ formatAmount(owe.balance) }}
              </td>
              <td>{{ formatDate(owe.createdAt) }}</td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td class="empty-state" colspan="4">
                <strong>{{ loading ? "Loading balances…" : "No outstanding balances" }}</strong>
                <span v-if="!loading">Everyone is settled up for the selected person.</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="meta.totalPages > 1" class="pagination">
        <button
          class="icon-button"
          type="button"
          aria-label="Previous page"
          :disabled="loading || meta.page <= 1"
          @click="loadOwes(meta.page - 1)"
        >
          ‹
        </button>
        <span>Page {{ meta.page }} of {{ meta.totalPages }}</span>
        <button
          class="icon-button"
          type="button"
          aria-label="Next page"
          :disabled="loading || meta.page >= meta.totalPages"
          @click="loadOwes(meta.page + 1)"
        >
          ›
        </button>
      </div>
    </section>
  </main>
</template>
