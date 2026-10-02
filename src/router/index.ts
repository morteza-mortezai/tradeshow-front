import { createRouter, createWebHistory } from "vue-router";
import ExpensesView from "../views/ExpensesView.vue";
import OwesView from "../views/OwesView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/expenses",
    },
    {
      path: "/expenses",
      name: "expenses",
      component: ExpensesView,
    },
    {
      path: "/owes",
      name: "owes",
      component: OwesView,
    },
  ],
});

export default router;
