import api from "./api";

export type UserOption = {
  id: number | string;
  label: string;
};

export type UserFilters = Record<string, string | number | boolean>;

export type UserSearchResult<T = Record<string, unknown>> = {
  items: T[];
  total: number;
};

function toOptions(items: unknown, labelKey = "name"): UserOption[] {
  if (!Array.isArray(items)) return [];

  return items.map((item: Record<string, unknown>) => ({
    id: item.id as string | number,
    label: String(
      item[labelKey] ?? item.fullName ?? item.name ?? item.label ?? item.id,
    ),
  }));
}

async function getOptions(path: string, labelKey = "name") {
  const { data } = await api.get(path);
  return toOptions(data, labelKey);
}

export const usersService = {
  async getAll(): Promise<UserOption[]> {
    const { data } = await api.get("/user");
    return toOptions(data, "fullName");
  },

  async search<T = Record<string, unknown>>(
    filters: UserFilters,
    page: number,
    limit: number,
  ): Promise<UserSearchResult<T>> {
    const params = Object.fromEntries(
      Object.entries({ ...filters, page, limit }).filter(([, value]) => {
        if (value === undefined || value === null) return false;
        if (typeof value === "string") return value !== "";
        if (typeof value === "boolean") return value !== false;
        return true;
      }),
    );
    const { data } = await api.get("/user", { params });
    const result = Array.isArray(data) ? { items: data, total: data.length } : data;

    return {
      items: result?.items ?? result?.data ?? [],
      total: result?.total ?? result?.items?.length ?? 0,
    };
  },

  getIndustries: () => getOptions("/industry"),
  getCompanies: () => getOptions("/company"),
  getCompanySizes: () => getOptions("/company/sizes", "size"),
  getJobTitles: () => getOptions("/job/names"),
  getJobLevels: () => getOptions("/job/levels", "level"),
  getContinents: () => getOptions("/location/continents"),
  getCountries: () => getOptions("/location/countries"),
  getLocalities: () => getOptions("/location/localities"),
  getMetros: () => getOptions("/location/metros"),
  getSkills: () => getOptions("/user/skills", "skill"),
  getLanguages: () => getOptions("/user/languages"),
  getInterests: () => getOptions("/user/interests", "interest"),
  getCertificates: () => getOptions("/user/certificates"),
};
