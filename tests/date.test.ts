import { describe, expect, it } from "vitest";
import { dayKey, getMonthCells, isSameMonth, uniqueDayCount } from "@/lib/date";

describe("date helpers", () => {
  it("builds a complete Sunday-first calendar grid", () => {
    const cells = getMonthCells(new Date(2026, 7, 1));
    expect(cells).toHaveLength(42);
    expect(cells[0]).toBeNull();
    expect(cells[6]?.getDate()).toBe(1);
    expect(cells[36]?.getDate()).toBe(31);
    expect(cells[41]).toBeNull();
  });

  it("groups timestamps by local calendar day", () => {
    expect(uniqueDayCount(["2026-08-03T08:00:00", "2026-08-03T20:00:00", "2026-08-04T08:00:00"])).toBe(2);
    expect(dayKey(new Date(2026, 7, 4, 23, 10))).toBe("2026-08-04");
  });

  it("matches only dates from the requested month", () => {
    expect(isSameMonth("2026-08-12T10:00:00.000Z", new Date(2026, 7, 1))).toBe(true);
    expect(isSameMonth("2026-09-01T10:00:00.000Z", new Date(2026, 7, 1))).toBe(false);
  });
});
