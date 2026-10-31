import { describe, expect, it } from "vitest";
import { resources } from "../../src/i18n/config";

describe("i18n localisation resources", () => {
  it("resolves identical non-empty resource keys for en, ru and kk", () => {
    const enKeys = Object.keys(resources.en.translation).sort();
    const ruKeys = Object.keys(resources.ru.translation).sort();
    const kkKeys = Object.keys(resources.kk.translation).sort();

    expect(ruKeys).toEqual(enKeys);
    expect(kkKeys).toEqual(enKeys);

    for (const key of enKeys as Array<keyof typeof resources.en.translation>) {
      expect(resources.en.translation[key].trim().length).toBeGreaterThan(0);
      expect(resources.ru.translation[key].trim().length).toBeGreaterThan(0);
      expect(resources.kk.translation[key].trim().length).toBeGreaterThan(0);
    }
  });
});
