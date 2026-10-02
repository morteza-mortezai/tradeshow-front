<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  expensesService,
  type Expense,
  type PaginationMeta,
} from "../services/expenses";
import { usersService, type UserOption } from "../services/users";

const pageSize = 20;
const emptyMeta: PaginationMeta = { page: 1, limit: pageSize, total: 0, totalPages: 1 };

const expenses = ref<Expense[]>([]);
const users = ref<UserOption[]>([]);
const meta = ref<PaginationMeta>(emptyMeta);
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const formError = ref("");
const isCreateModalOpen = ref(false);

const filters = reactive({
  search: "",
  userId: "",
  fromDate: "",
  toDate: "",
});

const form = reactive({
  paidById: "",
  expenseForId: "",
  amount: null as number | null,
  description: "",
});

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
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

async function loadExpenses(page = meta.value.page) {
  loading.value = true;
  error.value = "";

  try {
    const result = await expensesService.list({ ...filters, page, limit: pageSize });
    expenses.value = result.data;
    meta.value = result.meta;
  } catch (requestError) {
    error.value = messageFrom(requestError, "Unable to load expenses.");
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

function applyFilters() {
  void loadExpenses(1);
}

function clearFilters() {
  Object.assign(filters, { search: "", userId: "", fromDate: "", toDate: "" });
  void loadExpenses(1);
}

function resetForm() {
  Object.assign(form, {
    paidById: "",
    expenseForId: "",
    amount: null,
    description: "",
  });
  formError.value = "";
}

function openCreateModal() {
  resetForm();
  isCreateModalOpen.value = true;
}

function closeCreateModal() {
  if (!saving.value) isCreateModalOpen.value = false;
}

async function createExpense() {
  formError.value = "";

  if (!form.paidById || !form.expenseForId || !form.amount) {
    formError.value = "Choose both people and enter an amount.";
    return;
  }
  if (form.paidById === form.expenseForId) {
    formError.value = "The payer and the person who owes must be different.";
    return;
  }
  if (!Number.isInteger(form.amount) || form.amount <= 0) {
    formError.value = "Amount must be a positive whole number.";
    return;
  }

  saving.value = true;
  try {
    await expensesService.create({
      paidById: form.paidById,
      expenseForId: form.expenseForId,
      amount: form.amount,
      description: form.description.trim() || undefined,
    });
    isCreateModalOpen.value = false;
    await loadExpenses(1);
  } catch (requestError) {
    formError.value = messageFrom(requestError, "Unable to add the expense.");
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadExpenses(1);
  void loadUsers();
});
</script>

<template>
  <main class="workspace">
    <header class="page-header">
      <div>
        <p class="eyebrow">Shared spending</p>
        <h1>Expenses</h1>
        <p class="subtitle">Track every payment and see who it was made for.</p>
      </div>
      <button class="button button-primary" type="button" @click="openCreateModal">
        Add expense
      </button>
    </header>

    <section class="filter-panel" aria-label="Expense filters">
      <div class="filter-heading">
        <div>
          <p class="section-kicker">Find a payment</p>
          <h2>Filters</h2>
        </div>
      </div>
      <form class="filter-grid" @submit.prevent="applyFilters">
        <label class="field field-wide">
          <span>Search description</span>
          <input v-model.trim="filters.search" placeholder="Dinner, taxi, tickets…" />
        </label>
        <label class="field">
          <span>Person involved</span>
          <select v-model="filters.userId">
            <option value="">Everyone</option>
            <option v-for="user in users" :key="user.id" :value="String(user.id)">
              {{ user.label }}
            </option>
          </select>
        </label>
        <label class="field">
          <span>From</span>
          <input v-model="filters.fromDate" type="date" />
        </label>
        <label class="field">
          <span>To</span>
          <input v-model="filters.toDate" type="date" />
        </label>
        <div class="filter-actions">
          <button class="button button-primary" type="submit">Apply filters</button>
          <button class="button button-quiet" type="button" @click="clearFilters">Clear</button>
        </div>
      </form>
    </section>

    <section class="results-section" aria-live="polite">
      <div class="results-heading">
        <div>
          <p class="section-kicker">Payment history</p>
          <h2>{{ meta.total }} expense{{ meta.total === 1 ? "" : "s" }}</h2>
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
              <th>Description</th>
              <th>Paid by</th>
              <th>For</th>
              <th class="amount-cell">Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody v-if="expenses.length">
            <tr v-for="expense in expenses" :key="expense.id">
              <td><strong>{{ expense.description || "No description" }}</strong></td>
              <td>{{ expense.paidBy.fullName }}</td>
              <td>{{ expense.expenseFor.fullName }}</td>
              <td class="amount-cell amount">{{ formatAmount(expense.amount) }}</td>
              <td>{{ formatDate(expense.createdAt) }}</td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td class="empty-state" colspan="5">
                <strong>{{ loading ? "Loading expenses…" : "No expenses found" }}</strong>
                <span v-if="!loading">Try changing the filters or add the first expense.</span>
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
          @click="loadExpenses(meta.page - 1)"
        >
          ‹
        </button>
        <span>Page {{ meta.page }} of {{ meta.totalPages }}</span>
        <button
          class="icon-button"
          type="button"
          aria-label="Next page"
          :disabled="loading || meta.page >= meta.totalPages"
          @click="loadExpenses(meta.page + 1)"
        >
          ›
        </button>
      </div>
    </section>

    <div v-if="isCreateModalOpen" class="modal-backdrop" @click.self="closeCreateModal">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="add-expense-title">
        <div class="modal-heading">
          <div>
            <p class="section-kicker">New payment</p>
            <h2 id="add-expense-title">Add expense</h2>
          </div>
          <button class="close-button" type="button" aria-label="Close" @click="closeCreateModal">×</button>
        </div>
        <form class="expense-form" @submit.prevent="createExpense">
          <label class="field">
            <span>Paid by</span>
            <select v-model="form.paidById" required>
              <option value="" disabled>Select who paid</option>
              <option v-for="user in users" :key="user.id" :value="String(user.id)">
                {{ user.label }}
              </option>
            </select>
          </label>
          <label class="field">
            <span>Expense for</span>
            <select v-model="form.expenseForId" required>
              <option value="" disabled>Select who owes</option>
              <option v-for="user in users" :key="user.id" :value="String(user.id)">
                {{ user.label }}
              </option>
            </select>
          </label>
          <label class="field">
            <span>Amount</span>
            <input v-model.number="form.amount" type="number" min="1" step="1" inputmode="numeric" required />
          </label>
          <label class="field">
            <span>Description <em>(optional)</em></span>
            <input v-model.trim="form.description" maxlength="255" placeholder="What was this for?" />
          </label>
          <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
          <div class="modal-actions">
            <button class="button button-quiet" type="button" :disabled="saving" @click="closeCreateModal">
              Cancel
            </button>
            <button class="button button-primary" type="submit" :disabled="saving || !users.length">
              {{ saving ? "Saving…" : "Save expense" }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>
