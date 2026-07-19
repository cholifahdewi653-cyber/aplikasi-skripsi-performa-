import { ValidationError } from "../../error/error";

/**
 * Parse JSON string atau kembalikan nilai apa adanya.
 * Lempar ValidationError jika string tidak valid JSON.
 */
export const parseJsonField = (value: unknown, fieldName: string): unknown => {
  if (value === undefined || value === null) return [];
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    throw new ValidationError({
      [fieldName]: [`Format ${fieldName} tidak valid`],
    });
  }
};

/**
 * Generate slug from a string (e.g. name of product)
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};
