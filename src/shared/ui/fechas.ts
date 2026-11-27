const dos = (n: number) => String(n).padStart(2, '0');

export function fechaLocal(d: Date = new Date()): string {
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}
