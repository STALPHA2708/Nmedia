import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "fr" | "ar" | "en" | "es";
type Currency = "mad" | "eur" | "usd" | "gbp";
type DateFormat = "dd/mm/yyyy" | "mm/dd/yyyy" | "yyyy-mm-dd";
type Timezone = "morocco" | "france" | "uk" | "usa-east";

interface LocalizationContextType {
  language: Language;
  currency: Currency;
  dateFormat: DateFormat;
  timezone: Timezone;
  setLanguage: (language: Language) => void;
  setCurrency: (currency: Currency) => void;
  setDateFormat: (format: DateFormat) => void;
  setTimezone: (timezone: Timezone) => void;
  formatDate: (date: Date) => string;
  formatCurrency: (amount: number) => string;
  t: (key: string) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(
  undefined,
);

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error(
      "useLocalization must be used within a LocalizationProvider",
    );
  }
  return context;
}

// Translation dictionaries
const translations = {
  fr: {
    dashboard: "Dashboard",
    projects: "Projets",
    team: "Équipe",
    expenses: "Dépenses",
    invoicing: "Facturation",
    settings: "Paramètres",
    newProject: "Nouveau Projet",
    budget: "Budget",
    team_count: "personnes",
    active: "Actif",
    inactive: "Inactif",
    pending: "En attente",
    completed: "Terminé",
  },
  en: {
    dashboard: "Dashboard",
    projects: "Projects",
    team: "Team",
    expenses: "Expenses",
    invoicing: "Invoicing",
    settings: "Settings",
    newProject: "New Project",
    budget: "Budget",
    team_count: "people",
    active: "Active",
    inactive: "Inactive",
    pending: "Pending",
    completed: "Completed",
  },
  ar: {
    dashboard: "لوحة التحكم",
    projects: "المشاريع",
    team: "الفريق",
    expenses: "المصروفات",
    invoicing: "الفواتير",
    settings: "الإعدادات",
    newProject: "مشروع جديد",
    budget: "الميزانية",
    team_count: "أشخاص",
    active: "نشط",
    inactive: "غير نشط",
    pending: "في الانتظار",
    completed: "مكتمل",
  },
  es: {
    dashboard: "Panel de Control",
    projects: "Proyectos",
    team: "Equipo",
    expenses: "Gastos",
    invoicing: "Facturación",
    settings: "Configuración",
    newProject: "Nuevo Proyecto",
    budget: "Presupuesto",
    team_count: "personas",
    active: "Activo",
    inactive: "Inactivo",
    pending: "Pendiente",
    completed: "Completado",
  },
};

export function LocalizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("nomedia-language");
    return (saved as Language) || "fr";
  });

  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem("nomedia-currency");
    return (saved as Currency) || "mad";
  });

  const [dateFormat, setDateFormat] = useState<DateFormat>(() => {
    const saved = localStorage.getItem("nomedia-date-format");
    return (saved as DateFormat) || "dd/mm/yyyy";
  });

  const [timezone, setTimezone] = useState<Timezone>(() => {
    const saved = localStorage.getItem("nomedia-timezone");
    return (saved as Timezone) || "morocco";
  });

  // Persist settings
  useEffect(() => {
    localStorage.setItem("nomedia-language", language);

    // Update document language attribute
    document.documentElement.lang = language;

    // Update document direction for Arabic
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  useEffect(() => {
    localStorage.setItem("nomedia-currency", currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem("nomedia-date-format", dateFormat);
  }, [dateFormat]);

  useEffect(() => {
    localStorage.setItem("nomedia-timezone", timezone);
  }, [timezone]);

  // Translation function
  const t = (key: string): string => {
    return (
      translations[language][
        key as keyof (typeof translations)[typeof language]
      ] || key
    );
  };

  // Date formatting function
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    switch (dateFormat) {
      case "dd/mm/yyyy":
        return `${day}/${month}/${year}`;
      case "mm/dd/yyyy":
        return `${month}/${day}/${year}`;
      case "yyyy-mm-dd":
        return `${year}-${month}-${day}`;
      default:
        return `${day}/${month}/${year}`;
    }
  };

  // Currency formatting function
  const formatCurrency = (amount: number): string => {
    const currencySymbols = {
      mad: "MAD",
      eur: "€",
      usd: "$",
      gbp: "£",
    };

    const symbol = currencySymbols[currency];
    const formattedAmount = amount.toLocaleString(
      language === "ar" ? "ar-MA" : language === "fr" ? "fr-FR" : "en-US",
    );

    switch (currency) {
      case "mad":
        return `${formattedAmount} ${symbol}`;
      case "eur":
      case "gbp":
        return `${symbol}${formattedAmount}`;
      case "usd":
        return `$${formattedAmount}`;
      default:
        return `${formattedAmount} ${symbol}`;
    }
  };

  const value = {
    language,
    currency,
    dateFormat,
    timezone,
    setLanguage,
    setCurrency,
    setDateFormat,
    setTimezone,
    formatDate,
    formatCurrency,
    t,
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}
