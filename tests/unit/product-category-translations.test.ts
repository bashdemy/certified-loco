import { describe, expect, it } from "vitest";
import {
  getLocalizedName,
  parseProductCategoryTranslations,
} from "../../src/domain/product-category-translations";

const validTranslations = [
  { locale: "en", name: "Locomotive wheelsets", description: "English description" },
  { locale: "ru", name: "Колесные пары локомотивов", description: null },
  { locale: "kk", name: "Локомотивтердің дөңгелек жұптары", description: null },
];

describe("product category translations", () => {
  it("accepts English and supported translations", () => {
    expect(parseProductCategoryTranslations(validTranslations)).toEqual(
      validTranslations,
    );
  });

  it("requires a non-empty English baseline", () => {
    expect(
      parseProductCategoryTranslations(
        validTranslations.filter((translation) => translation.locale !== "en"),
      ),
    ).toBeNull();

    expect(
      parseProductCategoryTranslations([
        { locale: "en", name: "   ", description: null },
      ]),
    ).toBeNull();
  });

  it("rejects unsupported and duplicate locales", () => {
    expect(
      parseProductCategoryTranslations([
        ...validTranslations,
        { locale: "de", name: "Radsätze", description: null },
      ]),
    ).toBeNull();

    expect(
      parseProductCategoryTranslations([
        ...validTranslations,
        { locale: "en", name: "Duplicate", description: null },
      ]),
    ).toBeNull();
  });

  it("falls back to English when a selected translation is missing", () => {
    expect(getLocalizedName(validTranslations, "ru")).toBe("Колесные пары локомотивов");
    expect(getLocalizedName(validTranslations, "kk")).toBe(
      "Локомотивтердің дөңгелек жұптары",
    );
    expect(getLocalizedName([validTranslations[0]], "ru")).toBe("Locomotive wheelsets");
  });
});
