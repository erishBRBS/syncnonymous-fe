"use client";

import { Button } from "@/components/ui/button";
import { Globe } from "@/components/ui/globe";

export function WaitingRoom({
  displayName,
  onCancel,
}: {
  displayName: string;
  onCancel: () => void;
}) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
        <div className="w-full overflow-hidden rounded-2xl border bg-card shadow-sm">
          {/* Globe area (inside card) */}
          <div className="relative h-90 w-full overflow-hidden bg-muted/30">
            {/* optional soft gradient para mas maganda */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-background/60" />

            {/* globe mismo */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[320px] w-[320px] translate-y-[-10%] opacity-80">
                {/* ✅ ilagay mo dito yung Globe component mo */}
                <Globe className="h-full w-full" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <h1 className="text-2xl font-bold">Searching for a match..</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Welcome, <span className="font-medium">{displayName}</span>. Hang tight while we find someone for you.
            </p>

            <div className="mt-5 flex justify-center">
              <Button variant="outline" onClick={onCancel}>
                ✕ Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
