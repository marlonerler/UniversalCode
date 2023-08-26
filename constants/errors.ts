export const ERROR_NO_SENTENCE_TYPE = (characterIndex: number) =>
    `Could not determine type of sentence (character at index ${characterIndex})`;

export const ERROR_NO_CHARACTER_RECOGNITION = (characteIndex: number) =>
    `Could not recognize role of character at index ${characteIndex}`;
export const ERROR_NO_SENTENCE_RECOGNITION = (phraseIndex: number) =>
    `Could not recognize role of phrase at index ${phraseIndex}`;

export const ERROR_NO_CALCULATION_TYPE = (type: string) =>
    `Expected a calculation type but "${type}" does not match the pattern. This is an issue with the compiler, not the code to be compiled.`;
