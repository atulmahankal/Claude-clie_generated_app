/**
 * className Utility
 *
 * Combines clsx and tailwind-merge for optimal className handling
 * Use this to conditionally apply Tailwind classes and resolve conflicts
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
