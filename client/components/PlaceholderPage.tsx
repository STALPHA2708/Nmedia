import React from "react";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-nomedia-blue/10 flex items-center justify-center mb-4">
            <Construction className="h-6 w-6 text-nomedia-blue" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Cette page est en cours de développement. Continuez à me demander de créer le contenu spécifique dont vous avez besoin.
          </p>
          <Button variant="outline" className="w-full">
            Revenir au Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
