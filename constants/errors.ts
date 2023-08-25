export const ERROR_NO_PHRASE_TYPE = (characterIndex: number) => `Could not determine type of phrase (character at index ${characterIndex})`;
export const ERROR_NO_STATEMENT_TYPE = (phraseIndex: number) => `Could not determine type of statement (phrase at index ${phraseIndex})`;

export const ERROR_NO_CHARACTER_RECOGNITION = (characteIndex: number) => `Could not recognize role of character at position ${characteIndex}`;
export const ERROR_NO_PHRASE_RECOGNITION = (phraseIndex: number) => `Could not recognize role of phrase ${phraseIndex}`;
