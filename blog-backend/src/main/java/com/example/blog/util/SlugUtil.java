package com.example.blog.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Predicate;

/** Generates URL-friendly slugs and ensures uniqueness via a caller-supplied check. */
public final class SlugUtil {

    private SlugUtil() {}

    /** Convert arbitrary text into a lowercase, hyphenated slug. */
    public static String slugify(String input) {
        if (input == null || input.isBlank()) {
            return "n-a";
        }
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");                 // strip accents
        String slug = normalized.toLowerCase(Locale.ENGLISH)
                .replaceAll("[^a-z0-9\\s-]", "")           // drop punctuation
                .trim()
                .replaceAll("[\\s-]+", "-");               // spaces/dashes -> single dash
        slug = slug.replaceAll("^-+|-+$", "");             // trim leading/trailing dashes
        return slug.isBlank() ? "n-a" : slug;
    }

    /**
     * Produce a slug that passes {@code isTaken.negate()} by appending -2, -3, …
     * until a free value is found.
     */
    public static String uniqueSlug(String input, Predicate<String> isTaken) {
        String base = slugify(input);
        String candidate = base;
        int counter = 2;
        while (isTaken.test(candidate)) {
            candidate = base + "-" + counter++;
        }
        return candidate;
    }
}
