import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocalization } from "@/contexts/LocalizationContext";
import { Badge } from "@/components/ui/badge";

export function ThemeIndicator() {
  const { theme, accentColor, fontSize, actualTheme } = useTheme();
  const { language, currency } = useLocalization();

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card border rounded-lg p-2 shadow-lg">
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <Badge variant="outline" className="text-xs">
          {actualTheme === "dark" ? "🌙 Sombre" : "☀️ Clair"}
          {theme === "system" && " (Auto)"}
        </Badge>
        <Badge
          variant="outline"
          className="text-xs"
          style={{
            backgroundColor:
              accentColor === "blue"
                ? "hsl(239, 84%, 67%)"
                : accentColor === "purple"
                  ? "hsl(260, 83%, 70%)"
                  : accentColor === "green"
                    ? "hsl(142, 76%, 46%)"
                    : "hsl(25, 95%, 63%)",
            color: "white",
            borderColor: "transparent",
          }}
        >
          {accentColor === "blue"
            ? "🔵 Bleu"
            : accentColor === "purple"
              ? "🟣 Violet"
              : accentColor === "green"
                ? "🟢 Vert"
                : "🟠 Orange"}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {fontSize === "small"
            ? "A- Petit"
            : fontSize === "medium"
              ? "A Moyen"
              : "A+ Grand"}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {language === "fr"
            ? "🇫🇷 FR"
            : language === "ar"
              ? "🇲🇦 AR"
              : language === "en"
                ? "🇺🇸 EN"
                : "🇪🇸 ES"}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {currency.toUpperCase()}
        </Badge>
      </div>
    </div>
  );
}
