"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { QtyStepper } from "./qty-stepper";
import { money } from "@/lib/format";
import type { CatalogProducto } from "../loaders";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producto: CatalogProducto | null;
  qty: number;
  onChangeQty: (qty: number) => void;
};

export function QtySheet({
  open,
  onOpenChange,
  producto,
  qty,
  onChangeQty,
}: Props) {
  if (!producto) return null;

  const precio = Number(producto.precio);
  const subtotal = qty * precio;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader>
          <SheetTitle>{producto.nombre}</SheetTitle>
          <SheetDescription>
            {money(precio)} c/u
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <QtyStepper
            value={qty}
            onChange={onChangeQty}
          />
          {qty > 0 && (
            <p className="text-sm font-medium tabular-nums">
              Subtotal: <span className="text-primary">{money(subtotal)}</span>
            </p>
          )}
        </div>

        {qty > 0 && (
          <div className="px-4 pb-2">
            <Button
              type="button"
              variant="ghost"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                onChangeQty(0);
                onOpenChange(false);
              }}
            >
              <Trash2 className="size-4" />
              Quitar producto
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
