import { describe, it, expect, beforeAll } from "vitest";

let SITE_URL: string;
let absoluteUrlFn: (path?: string) => string;

beforeAll(async () => {
  const mod = await import("./site");
  SITE_URL = mod.SITE_URL;
  absoluteUrlFn = mod.absoluteUrl;
});

describe("site config", () => {
  it("has a valid SITE_URL", () => {
    expect(SITE_URL).toMatch(/^https?:\/\/.+/);
  });
});

describe("absoluteUrl", () => {
  it("returns base URL for default path", () => {
    expect(absoluteUrlFn()).toBe(`${SITE_URL}/`);
  });

  it("appends path to SITE_URL", () => {
    expect(absoluteUrlFn("/test")).toBe(`${SITE_URL}/test`);
  });

  it("handles absolute URLs without modification", () => {
    expect(absoluteUrlFn("https://other.com/img.png")).toBe("https://other.com/img.png");
  });

  it("adds leading slash if missing", () => {
    expect(absoluteUrlFn("path")).toBe(`${SITE_URL}/path`);
  });
});
