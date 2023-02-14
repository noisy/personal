import type { IProject, ITalk } from "@/types";
import { describe, expect, it } from "vitest";
import { forTestingsOnly, getDynamicFilters } from "./filters";

const { extractUsedFilterTags } = forTestingsOnly;

describe("extractUsedFilterTags", () => {
  it("extractUsedFilterTags extracts an empty list of filter tags in case wrongAttribiute name is used to store tags in DB ", () => {
    const projects = [
      { wrongAttribiute: ["a", "b", "c"] },
      { wrongAttribiute: ["a", "b", "c"] },
      { wrongAttribiute: ["a", "b", "c"] },
    ] as unknown as IProject[];

    const usedFilterTags = extractUsedFilterTags(projects, "filterTags");
    expect(usedFilterTags).toEqual([]);
  });

  it("extractUsedFilterTags extracts a list of not repeating tags if all 3 projects use the same 3 tags ", () => {
    const projects = [
      { filterTags: ["a", "b", "c"] },
      { filterTags: ["a", "b", "c"] },
      { filterTags: ["a", "b", "c"] },
    ] as unknown as IProject[];

    const usedFilterTags = extractUsedFilterTags(projects, "filterTags");
    expect(usedFilterTags).toEqual(["a", "b", "c"]);
  });

  it("extractUsedFilterTags extracts a list of not repeating tags in case some tags are used more than once ", () => {
    const projects = [
      { filterTags: ["a", "b", "c"] },
      { filterTags: ["b", "c", "d"] },
      { filterTags: ["x", "y", "z"] },
    ] as unknown as IProject[];

    const usedFilterTags = extractUsedFilterTags(projects, "filterTags");
    expect(usedFilterTags).toEqual(["a", "b", "c", "d", "x", "y", "z"]);
  });

  it("extractUsedFilterTags extracts a list from an attrbute, which constain an item and not a list of items", () => {
    const talks = [
      { language: "polish" },
      { language: "english" },
      { language: "spanish" },
      { language: "english" },
    ] as unknown as ITalk[];

    const usedFilterTags = extractUsedFilterTags(talks, "language");
    expect(usedFilterTags).toEqual(["polish", "english", "spanish"]);
  });
});

describe("getDynamicFilters", () => {
  describe("Missing filters", () => {
    it("getDynamicFilters for tags which do not have a pair in provided filters, throws an error", () => {
      const projects = [
        { filterTags: ["a", "b", "c"] },
      ] as unknown as IProject[];

      expect(() =>
        getDynamicFilters(projects, "filterTags", [
          { name: "All", tag: "*" },
          { name: "AAA", tag: "a" },
          { name: "BBB", tag: "b" },
        ])
      ).toThrowError("Some tags do not have pair in filters: c");
    });

    it("getDynamicFilters for missing filter with tag *, throws an error", () => {
      const projects = [
        { filterTags: ["a", "b", "c"] },
      ] as unknown as IProject[];
      expect(() =>
        getDynamicFilters(projects, "filterTags", [
          { name: "AAA", tag: "a" },
          { name: "BBB", tag: "b" },
          { name: "CCC", tag: "c" },
        ])
      ).toThrowError("Some tags do not have pair in filters: *");
    });
  });

  describe("Pairing tags with filters", () => {
    it("getDynamicFilters uses defined filters names for specific tags", () => {
      const projects = [
        { filterTags: ["a", "b"] },
        { filterTags: ["c"] },
      ] as unknown as IProject[];

      const filters = getDynamicFilters(projects, "filterTags", [
        { name: "All", tag: "*" },
        { name: "AAA", tag: "a" },
        { name: "BBB", tag: "b" },
        { name: "CCC", tag: "c" },
      ]);

      expect(filters).toEqual([
        { name: "All", tag: "*" },
        { name: "AAA", tag: "a" },
        { name: "BBB", tag: "b" },
        { name: "CCC", tag: "c" },
      ]);
    });

    it("getDynamicFilters allows to set a name for default All(*) filter", () => {
      const projects = [{ filterTags: ["a", "b"] }] as unknown as IProject[];

      const filters = getDynamicFilters(projects, "filterTags", [
        { name: "Everything", tag: "*" },
        { name: "AAA", tag: "a" },
        { name: "BBB", tag: "b" },
      ]);

      expect(filters).toEqual([
        { name: "Everything", tag: "*" },
        { name: "AAA", tag: "a" },
        { name: "BBB", tag: "b" },
      ]);
    });
  });

  describe("Skipping not needed filters", () => {
    it("getDynamicFilters skips filters which are not needed", () => {
      const projects = [{ filterTags: ["a", "b"] }] as unknown as IProject[];

      const filters = getDynamicFilters(projects, "filterTags", [
        { name: "All", tag: "*" },
        { name: "AAA", tag: "a" },
        { name: "BBB", tag: "b" },
        { name: "CCC", tag: "c" },
        { name: "DDD", tag: "d" },
      ]);

      expect(filters).toEqual([
        { name: "All", tag: "*" },
        { name: "AAA", tag: "a" },
        { name: "BBB", tag: "b" },
      ]);
    });
  });

  describe("Order of filters", () => {
    it('order of filters determines the order of returned filters. "All" if not specified otherwise, should be always the first one', () => {
      const talks = [
        { language: "polish" },
        { language: "english" },
        { language: "spanish" },
      ] as unknown as ITalk[];

      const filters = getDynamicFilters(talks, "language", [
        { name: "🇬🇧", tag: "english" },
        { name: "🇵🇱", tag: "polish" },
        { name: "🌎", tag: "*" },
        { name: "🇪🇸", tag: "spanish" },
      ]);

      expect(filters).toEqual([
        { name: "🇬🇧", tag: "english" },
        { name: "🇵🇱", tag: "polish" },
        { name: "🌎", tag: "*" },
        { name: "🇪🇸", tag: "spanish" },
      ]);
    });
  });
});
