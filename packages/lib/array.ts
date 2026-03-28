export const notUndefined = <T>(val: T | undefined): val is T => Boolean(val);
export const uniqueBy = <T extends { [key: string]: unknown }>(array: T[], keys: (keyof T)[]) => {
  return array.filter(
    (item, index, self) => index === self.findIndex((t) => keys.every((key) => t[key] === item[key]))
  );
};

export function dedupeSequentialBy<T>(items: readonly T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(item);
  }
  return out;
}
