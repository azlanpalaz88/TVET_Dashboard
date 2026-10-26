import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const percent = (value: number) => new Intl.NumberFormat("ms-MY", { style: "percent", maximumFractionDigits: 1 }).format(value);
export const ringgit = (value: number | null) => value === null ? "Tiada data" : new Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 0 }).format(value);
