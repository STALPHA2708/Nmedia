import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectApi } from "@/lib/api";
import type { Project, CreateProjectRequest } from "@shared/api";
import { useToast } from "@/hooks/use-toast";

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters: string) => [...projectKeys.lists(), { filters }] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
  stats: () => [...projectKeys.all, "stats"] as const,
};

/**
 * Hook to fetch all projects with caching
 */
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: async () => {
      const response = await projectApi.getAll();
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

/**
 * Hook to fetch project statistics
 */
export function useProjectStats() {
  return useQuery({
    queryKey: projectKeys.stats(),
    queryFn: async () => {
      const response = await projectApi.getStats();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a new project with optimistic updates
 */
export function useCreateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateProjectRequest) => {
      const response = await projectApi.create(data);
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Projet créé avec succès",
        description: `Le projet "${data.name}" a été créé`,
      });
    },
    onError: (err) => {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de la création du projet",
        variant: "destructive",
      });
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: projectKeys.stats() }),
      ]);
    },
  });
}

/**
 * Hook to update a project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateProjectRequest> }) => {
      const response = await projectApi.update(id, data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Projet mis à jour avec succès",
      });
    },
    onError: (err) => {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de la modification",
        variant: "destructive",
      });
    },
    onSettled: async (data, error, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) }),
        queryClient.invalidateQueries({ queryKey: projectKeys.stats() }),
      ]);
    },
  });
}

/**
 * Hook to delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      await projectApi.delete(id);
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Projet supprimé avec succès",
      });
    },
    onError: (err) => {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de la suppression",
        variant: "destructive",
      });
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: projectKeys.stats() }),
      ]);
    },
  });
}
