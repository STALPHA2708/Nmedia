import { z } from "zod";

/**
 * Validation schema for employee creation and update
 */
export const employeeSchema = z.object({
  firstName: z
    .string()
    .min(1, "Le prénom est obligatoire")
    .max(100, "Le prénom ne peut pas dépasser 100 caractères"),

  lastName: z
    .string()
    .min(1, "Le nom est obligatoire")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),

  email: z
    .string()
    .min(1, "L'email est obligatoire")
    .email("Format d'email invalide")
    .max(255, "L'email ne peut pas dépasser 255 caractères"),

  phone: z
    .string()
    .min(8, "Le numéro de téléphone doit contenir au moins 8 chiffres")
    .max(20, "Le numéro de téléphone ne peut pas dépasser 20 caractères"),

  address: z
    .string()
    .min(1, "L'adresse est obligatoire")
    .max(500, "L'adresse ne peut pas dépasser 500 caractères"),

  position: z
    .string()
    .min(1, "Le poste est obligatoire")
    .max(100, "Le poste ne peut pas dépasser 100 caractères"),

  department: z
    .string()
    .min(1, "Le département est obligatoire")
    .refine((val) => !isNaN(Number(val)), "Département invalide"),

  salary: z
    .string()
    .min(1, "Le salaire est obligatoire")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Le salaire doit être supérieur à 0"),

  hireDate: z
    .string()
    .min(1, "La date d'embauche est obligatoire")
    .refine((val) => !isNaN(Date.parse(val)), "Date invalide"),

  contractType: z
    .string()
    .min(1, "Le type de contrat est obligatoire"),

  contractStartDate: z
    .string()
    .min(1, "La date de début du contrat est obligatoire")
    .refine((val) => !isNaN(Date.parse(val)), "Date invalide"),

  contractEndDate: z
    .string()
    .optional(),

  contractFile: z
    .instanceof(File)
    .optional()
    .nullable(),
}).refine(
  (data) => {
    // Validate that CDD and Stage contracts have an end date
    if (data.contractType === "CDD" || data.contractType === "Stage") {
      return !!data.contractEndDate && data.contractEndDate.length > 0;
    }
    return true;
  },
  {
    message: "La date de fin est obligatoire pour les CDD et stages",
    path: ["contractEndDate"],
  }
);

export type EmployeeFormData = z.infer<typeof employeeSchema>;
