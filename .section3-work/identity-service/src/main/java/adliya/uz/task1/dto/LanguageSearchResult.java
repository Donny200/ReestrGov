package adliya.uz.task1.dto;

/** A language from the built-in Java ISO catalogue, annotated for the admin UI. */
public record LanguageSearchResult(
        String code,
        String name,
        String nativeName,
        boolean alreadyAdded
) {
}
