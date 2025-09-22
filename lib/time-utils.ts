export function formatRelativeTime(timestamp: string): string {
  // Handle PostgreSQL timestamp format and ensure proper parsing
  let date: Date
  
  // If timestamp looks like PostgreSQL format without timezone, convert to ISO format
  if (timestamp.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/)) {
    // PostgreSQL timestamp - convert to ISO format and assume UTC
    const isoString = timestamp.replace(' ', 'T') + 'Z'
    date = new Date(isoString)
  } else {
    date = new Date(timestamp)
  }
  
  // Fallback if date is still invalid
  if (isNaN(date.getTime())) {
    return 'Invalid date'
  }
  
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  // Handle negative values (future dates)
  if (seconds < 0) {
    return 'Just now'
  }

  if (seconds < 60) {
    return `${seconds}s ago`
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.floor(hours / 24)
  if (days < 7) {
    return `${days}d ago`
  }

  const weeks = Math.floor(days / 7)
  if (weeks < 4) {
    return `${weeks}w ago`
  }

  const months = Math.floor(days / 30)
  if (months < 12) {
    return `${months}mo ago`
  }

  const years = Math.floor(days / 365)
  return `${years}y ago`
}
