import { useQuery } from "@tanstack/react-query";
import { contractTypeApi } from "@/lib/api";

export const contractTypeKeys = {
  all: ["contractTypes"] as const,
  lists: () => [...contractTypeKeys.all, "list"] as const,
  detail: (id: number) => [...contractTypeKeys.all, "detail", id] as const,
};

/**
 * Hook to fetch all contract types with caching
 */
export function useContractTypes() {
  return useQuery({
    queryKey: contractTypeKeys.lists(),
    queryFn: async () => {
      const response = await contractTypeApi.getAll();
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - contract types change rarely
  });
}
