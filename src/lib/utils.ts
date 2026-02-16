import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPhone = (val: string) => {
  if (!val) return ""
  val = val.replace(/\D/g, '')
  val = val.substring(0, 11)

  if (val.length === 0) return val

  if (val.length <= 2) return `(${val}`

  if (val.length <= 6) return `(${val.substring(0, 2)}) ${val.substring(2)}`

  if (val.length <= 10) return `(${val.substring(0, 2)}) ${val.substring(2, 6)}-${val.substring(6)}`

  return `(${val.substring(0, 2)}) ${val.substring(2, 7)}-${val.substring(7)}`
}
