export function toPlainText(obj: any) {
  return (
    '\n' +
    Object.entries(obj)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n') +
    '\n\n'
  )
}
