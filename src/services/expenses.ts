import api from "./api";

export type UserReference = {
  id: string;
  fullName: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Expense = {
  id: string;
  paidBy: UserReference;
  expenseFor: UserReference;
  amount: number;
  description?: string | null;
  createdAt: string;
};

export type Owe = {
  id: string;
  fromUser: UserReference;
  toUser: UserReference;
  balance: number;
  createdAt: string;
};

type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type ExpenseFilters = {
  search?: string;
  userId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
};

export type OweFilters = {
  userId?: string;
  page?: number;
  limit?: number;
};

export type CreateExpensePayload = {
  paidById: string;
  expenseForId: string;
  amount: number;
  description?: string;
};

function withoutEmptyValues<T extends Record<string, unknown>>(params: T) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  );
}

export const expensesService = {
  async list(filters: ExpenseFilters): Promise<PaginatedResponse<Expense>> {
    const { data } = await api.get<PaginatedResponse<Expense>>("/expense", {
      params: withoutEmptyValues(filters),
    });
    return data;
  },

  async create(payload: CreateExpensePayload): Promise<void> {
    await api.post("/expense", payload);
  },

  async listOwes(filters: OweFilters): Promise<PaginatedResponse<Owe>> {
    const { data } = await api.get<PaginatedResponse<Owe>>("/expense/owes", {
      params: withoutEmptyValues(filters),
    });
    return data;
  },
};
