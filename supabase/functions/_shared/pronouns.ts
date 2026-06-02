// Shared pronoun helper for AI prompts.

export type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say" | null | undefined;

/**
 * Returns a system-prompt directive like:
 *   "Refer to the user using he/him pronouns."
 * Returns an empty string for prefer_not_to_say / null / unknown values.
 */
export function buildPronounDirective(gender: Gender): string {
  switch (gender) {
    case "male":
      return "Refer to the user using he/him pronouns.";
    case "female":
      return "Refer to the user using she/her pronouns.";
    case "non_binary":
      return "Refer to the user using they/them pronouns.";
    default:
      return "";
  }
}
