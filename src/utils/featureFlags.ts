// Local feature flags - override bun:bundle for development
export function feature(name: string): boolean {
  // Enable BUDDY locally
  if (name === 'BUDDY') return true

  // Default to false for unknown features
  return false
}
