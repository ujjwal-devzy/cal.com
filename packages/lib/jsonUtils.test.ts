import { describe, expect, it } from "vitest";

import { parseUniqueJsonStringList } from "./jsonUtils";

describe("parseUniqueJsonStringList", () => {
  it("parses string arrays and preserves first occurrence order", () => {
    expect(parseUniqueJsonStringList('["a","b","a","c"]')).toEqual(["a", "b", "c"]);
  });

  it("ignores non-string elements", () => {
    expect(parseUniqueJsonStringList('["a",1,null,"a",true,"b"]')).toEqual(["a", "b"]);
  });

  it("returns empty for invalid json", () => {
    expect(parseUniqueJsonStringList("not json")).toEqual([]);
  });

  it("returns empty when root is not an array", () => {
    expect(parseUniqueJsonStringList('{"x":1}')).toEqual([]);
  });
});
