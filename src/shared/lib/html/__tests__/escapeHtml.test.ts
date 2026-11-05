import { escapeHtml } from "@/shared/lib/html/escapeHtml";

describe("escapeHtml", () => {
  it("HTML の特殊文字をエスケープする", () => {
    expect(escapeHtml(`<b class="x">A & B's</b>`)).toBe(
      "&lt;b class=&quot;x&quot;&gt;A &amp; B&#39;s&lt;/b&gt;"
    );
  });

  it("null / undefined は空文字を返す", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("数値や通常の文字列はそのまま返す", () => {
    expect(escapeHtml(42)).toBe("42");
    expect(escapeHtml("東京都千代田区1-1")).toBe("東京都千代田区1-1");
  });
});
