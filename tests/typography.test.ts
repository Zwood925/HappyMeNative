import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function visibleFiles(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    if (statSync(path).isDirectory()) return visibleFiles(path);
    return path.endsWith(".tsx") ? [path] : [];
  });
}

const files = [...visibleFiles("app"), ...visibleFiles("components")];

describe("App Review typography safeguards", () => {
  it("keeps every explicit visible font at 13 points or larger", () => {
    const violations = files.flatMap((file) => {
      const source = readFileSync(file, "utf8");
      return [...source.matchAll(/fontSize:\s*(\d+)/g)]
        .filter((match) => Number(match[1]) < 13)
        .map((match) => `${file}:${match[1]}`);
    });
    expect(violations).toEqual([]);
  });

  it("does not force visible copy into a single clipped line", () => {
    const violations = files.filter((file) => /numberOfLines\s*=\s*\{\s*1\s*\}/.test(readFileSync(file, "utf8")));
    expect(violations).toEqual([]);
  });

  it("targets corrected iOS build 4", () => {
    expect(readFileSync("app.config.ts", "utf8")).toContain('buildNumber: "4"');
  });
});
