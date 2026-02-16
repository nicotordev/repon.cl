import { UnitOfMeasure } from "@/lib/backend";

export const CATEGORIES = [
  "Bebidas",
  "Abarrotes",
  "Lácteos",
  "Verduras",
  "Panadería",
  "Otro",
];

export const UOM_OPTIONS: { value: UnitOfMeasure; label: string }[] = [
  { value: "UNIT", label: "Unidad" },
  { value: "GRAM", label: "Gramos" },
  { value: "KILOGRAM", label: "Kilogramos" },
  { value: "MILLILITER", label: "Mililitros" },
  { value: "LITER", label: "Litros" },
];
