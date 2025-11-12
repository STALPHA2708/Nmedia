import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoiceApi } from "@/lib/api";
import type { Invoice, CreateInvoiceRequest } from "@shared/api";
import { useToast } from "@/hooks/use-toast";

export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoiceKeys.all, "list"] as const,
  list: (filters: string) => [...invoiceKeys.lists(), { filters }] as const,
  details: () => [...invoiceKeys.all, "detail"] as const,
  detail: (id: number) => [...invoiceKeys.details(), id] as const,
  stats: () => [...invoiceKeys.all, "stats"] as const,
};

/**
 * Hook to fetch all invoices with caching
 */
export function useInvoices() {
  return useQuery({
    queryKey: invoiceKeys.lists(),
    queryFn: async () => {
      const response = await invoiceApi.getAll();
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - invoices update frequently
    placeholderData: (previousData) => previousData, // Keep previous data while refetching to prevent UI flashing
  });
}

/**
 * Hook to fetch invoice statistics
 */
export function useInvoiceStats() {
  return useQuery({
    queryKey: invoiceKeys.stats(),
    queryFn: async () => {
      const response = await invoiceApi.getStats();
      return response.data;
    },
    staleTime: 3 * 60 * 1000,
  });
}

/**
 * Hook to create a new invoice
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateInvoiceRequest) => {
      const response = await invoiceApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "✅ Facture créée avec succès",
        description: "La facture a été créée",
      });
    },
    onError: (err) => {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de la création de la facture",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Fire cache invalidations without awaiting - let them run in background
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() });
    },
  });
}

/**
 * Hook to update an invoice
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateInvoiceRequest> }) => {
      const response = await invoiceApi.update(id, data);
      return response.data;
    },
    onError: (err) => {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de la modification",
        variant: "destructive",
      });
    },
    onSettled: (data, error, variables) => {
      // Fire cache invalidations without awaiting - let them run in background
      // This keeps the UI responsive and prevents dialog from getting stuck
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() });
    },
  });
}

/**
 * Hook to delete an invoice
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      await invoiceApi.delete(id);
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Facture supprimée avec succès",
      });
    },
    onError: (err) => {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de la suppression",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Fire cache invalidations without awaiting - let them run in background
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() });
    },
  });
}
