"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addCurrency } from "@/server/settings";

export function CurrenciesAddButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleAdd() {
    const trimmedCode = code.trim();
    const trimmedName = name.trim();

    if (!trimmedCode || !trimmedName) return;
    setIsLoading(true);
    try {
      await addCurrency(trimmedCode, trimmedName);
      setCode("");
      setName("");
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setIsOpen(true)}>
        <Plus className="flex-1" />
        Добавить
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новая валюта</DialogTitle>
            <DialogDescription>Добавьте свою валюту</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label htmlFor="currency-code">Код валюты</Label>
              <Input
                id="currency-code"
                placeholder="USD"
                value={code}
                onChange={(e) =>
                  setCode(
                    e.target.value.replace(/[^A-Za-z]/g, "").toUpperCase(),
                  )
                }
                maxLength={3}
              />
            </Field>
            <Field>
              <Label htmlFor="currency-name">Название</Label>
              <Input
                id="currency-name"
                placeholder="Доллар США"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              onClick={handleAdd}
              disabled={isLoading || !code.trim() || !name.trim()}
            >
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
