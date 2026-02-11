import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";

describe("sanitize_stock_news script", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("sanitizes text, removes promo blocks, and drops paywalled items", async () => {
    const payload = {
      AAPL: [
        {
          title: "Appleâ€™s headline",
          link: "https://example.com/aapl",
          ticker: "AAPL",
          full_text:
            "Some text â€œquotedâ€� here. Read Next: promo text that should be removed.",
        },
        {
          title: "Paywalled item",
          link: "https://example.com/premium",
          ticker: "AAPL",
          full_text: "PREMIUM Upgrade to read this article",
        },
      ],
    };

    const readSpy = vi
      .spyOn(fs, "readFileSync")
      .mockReturnValue(JSON.stringify(payload));
    const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {
      // noop
    });

    const { sanitizeStockNews } = await import(
      "../../scripts/sanitize_stock_news.js"
    );
    sanitizeStockNews();

    expect(readSpy).toHaveBeenCalledTimes(1);
    expect(writeSpy).toHaveBeenCalledTimes(1);
    const [, serialized] = writeSpy.mock.calls[0];
    const output = JSON.parse(serialized);
    expect(output.AAPL).toHaveLength(1);
    expect(output.AAPL[0]).toMatchObject({
      title: "Apple's headline",
      link: "https://example.com/aapl",
      ticker: "AAPL",
      full_text: "Some text â€œquotedâ€� here.",
    });
  });
});
