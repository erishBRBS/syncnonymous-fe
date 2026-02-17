"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface NameEntryProps {
  onSubmit: (displayName: string) => void;
  isLoading: boolean;
}

export function NameEntry({ onSubmit, isLoading }: NameEntryProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length > 0) {
      onSubmit(trimmed);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-primary/10">
            <MessageCircle className="size-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-balance">
            Anonymous Chat
          </CardTitle>
          <CardDescription className="text-balance">
            Start talking anonymously. No accounts, no profiles, just pure conversation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="display-name"
                className="text-sm font-medium text-foreground"
              >
                Display Name
              </label>
              <Input
                id="display-name"
                type="text"
                placeholder="Enter your display name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                autoFocus
                disabled={isLoading}
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={name.trim().length === 0 || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Connecting...
                </span>
              ) : (
                "Find match"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
