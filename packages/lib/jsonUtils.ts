import { dedupeSequentialBy } from "./array";

export const validJson = (jsonString: string) => {
  try {
    const o = JSON.parse(jsonString);
    if (o && typeof o === "object") {
      return o;
    }
  } catch (e) {
    console.log("Invalid JSON:", e);
  }
  return false;
};

export function parseUniqueJsonStringList(jsonString: string): string[] {
  const parsed = validJson(jsonString);
  if (!Array.isArray(parsed)) {
    return [];
  }
  const strings = parsed.filter((x): x is string => typeof x === "string");
  return dedupeSequentialBy(strings, (s) => s);
}
