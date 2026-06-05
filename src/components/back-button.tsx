"use client";
import { Button } from "@base-ui/react";
import { ChevronLeft } from "lucide-react";

export function BackButton() {
  return (
    <Button
      className="w-10 h-10 flex rounded-full items-center justify-center"
      onClick={() => window.history.back()}
    >
      <ChevronLeft />
    </Button>
  );
}
