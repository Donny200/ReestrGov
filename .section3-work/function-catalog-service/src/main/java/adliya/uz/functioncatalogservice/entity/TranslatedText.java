package adliya.uz.functioncatalogservice.entity;

/** A translated value and the way it was supplied. */
public record TranslatedText(String text, String source) {

    public static final String HUMAN = "human";
    public static final String MACHINE = "machine";
}
