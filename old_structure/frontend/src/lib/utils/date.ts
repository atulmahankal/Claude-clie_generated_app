/**
 * Date Formatting Utilities
 *
 * Functions for formatting and manipulating dates
 */

import { format, formatDistance, formatRelative, isToday, isTomorrow, isYesterday, isPast, isFuture } from 'date-fns'

export function formatDate(date: Date | string, formatString: string = 'MMM dd, yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, formatString)
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'MMM dd, yyyy HH:mm')
}

export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isToday(dateObj)) {
    return 'Today'
  }
  if (isTomorrow(dateObj)) {
    return 'Tomorrow'
  }
  if (isYesterday(dateObj)) {
    return 'Yesterday'
  }

  return formatRelative(dateObj, new Date())
}

export function formatDistanceToNow(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return formatDistance(dateObj, new Date(), { addSuffix: true })
}

export function isDueSoon(dueDate: Date | string, daysThreshold: number = 3): boolean {
  const dateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  const now = new Date()
  const diffTime = dateObj.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays >= 0 && diffDays <= daysThreshold
}

export function isOverdue(dueDate: Date | string): boolean {
  const dateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  return isPast(dateObj) && !isToday(dateObj)
}
