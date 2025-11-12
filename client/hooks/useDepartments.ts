import { useQuery } from "@tanstack/react-query";
import { departmentApi } from "@/lib/api";

export const departmentKeys = {
  all: ["departments"] as const,
  lists: () => [...departmentKeys.all, "list"] as const,
  detail: (id: number) => [...departmentKeys.all, "detail", id] as const,
};

/**
 * Hook to fetch all departments with caching
 */
export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.lists(),
    queryFn: async () => {
      const response = await departmentApi.getAll();
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - departments change rarely
  });
}
