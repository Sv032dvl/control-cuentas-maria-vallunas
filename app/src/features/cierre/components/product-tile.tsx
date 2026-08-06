"use client";

import { forwardRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { GripVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { money } from "@/lib/format";
import type { CatalogProducto } from "../loaders";

type Props = {
  producto: CatalogProducto;
  qty: number;
  onPress: () => void;
  sortable?: boolean;
};

export function ProductTile({ producto, qty, onPress, sortable = false }: Props) {
  if (sortable) {
    return <SortableTile producto={producto} qty={qty} onPress={onPress} />;
  }
  return <TileContent producto={producto} qty={qty} onPress={onPress} />;
}

function SortableTile({ producto, qty, onPress }: Omit<Props, "sortable">) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: producto.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TileContent
      ref={setNodeRef}
      style={style}
      producto={producto}
      qty={qty}
      onPress={onPress}
      isDragging={isDragging}
      dragAttributes={attributes}
      dragListeners={listeners}
      showGrip
    />
  );
}

type TileContentProps = {
  producto: CatalogProducto;
  qty: number;
  onPress: () => void;
  isDragging?: boolean;
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap;
  showGrip?: boolean;
  style?: React.CSSProperties;
};

const TileContent = forwardRef<HTMLDivElement, TileContentProps>(
  function TileContent(
    { producto, qty, onPress, isDragging, dragAttributes, dragListeners, showGrip, style },
    ref,
  ) {
    const active = qty > 0;

    return (
      <Card
        ref={ref}
        role="button"
        aria-label={`${producto.nombre}, ${money(Number(producto.precio))}${active ? `, cantidad: ${qty}` : ""}`}
        className={cn(
          "p-3 flex flex-col justify-between cursor-pointer select-none transition-all duration-200 min-h-[92px] rounded-2xl",
          !showGrip && "active:scale-[0.97]",
          active
            ? "ring-2 ring-primary/40 bg-primary/5 shadow-md shadow-primary/5"
            : "glass-panel hover:shadow-md",
          isDragging && "opacity-60 z-50 shadow-xl scale-105",
        )}
        style={style}
        onClick={showGrip ? undefined : onPress}
        onContextMenu={(e) => e.preventDefault()}
        {...(showGrip ? { ...dragAttributes, ...dragListeners } : {})}
      >
        {showGrip && (
          <div className="flex justify-center -mt-1 mb-0.5 text-muted-foreground">
            <GripVertical className="size-3.5" />
          </div>
        )}
        <p className="text-xs font-medium leading-tight line-clamp-2">
          {producto.nombre}
        </p>
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {money(Number(producto.precio))}
          </span>
          {active && (
            <span className="size-6 rounded-full btn-gradient text-[11px] font-bold flex items-center justify-center shrink-0 shadow-sm">
              {qty}
            </span>
          )}
        </div>
      </Card>
    );
  },
);
