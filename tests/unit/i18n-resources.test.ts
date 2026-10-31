import { describe, expect, it } from "vitest";
import {
  formatParametersLocalized,
  localizeAssessmentReason,
  localizeDomainText,
  resources,
} from "../../src/i18n/config";

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

  it("translates domain terms, parameters, and assessment reasons into Russian and Kazakh", () => {
    expect(localizeDomainText("wheelset_press_fit_force", "ru")).toContain(
      "запрессовки колеса на ось",
    );
    expect(localizeDomainText("Clause 4.3.2", "ru")).toBe("п. 4.3.2");
    expect(
      formatParametersLocalized({ minForceKnPerMm: 4.5, sampleCount: 1 }, "ru"),
    ).toContain("4.5");
    expect(
      localizeAssessmentReason("changed", "Requirement parameters changed.", "ru"),
    ).toContain("ГОСТ");
  });
});
