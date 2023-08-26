#!/usr/bin/env node
import {
    ERROR_NO_CALCULATION_TYPE,
    ERROR_NO_SENTENCE_RECOGNITION,
    ERROR_NO_SENTENCE_TYPE,
} from '../constants/errors';
import {
    CalculationType,
    Sentence,
    SentenceType,
    calculationTypeArray,
} from '../types/parser';
import {
    checkIfCharacterIsSpace,
    removeOuterSpacesFromCharacterArray,
} from '../utility/characters';

// DATA
let sentences: Sentence[];

// sentences
let charactersOfCurrentSentence: string[];
let currentSentenceType: SentenceType | undefined;
let trailingSentence: Sentence | undefined;

// current scope/block
let markerOfCurrentString: string | undefined;
let isCurrentlyInsideAccessor: boolean;
let isCurrentlyInsideComment: boolean;
let isCurrentlyInsideParentheses: boolean;
let isEscaping: boolean;

// tracking loop
let indexOfCurrentCharacter: number = 0;
let currentCharacter: string = '';
let leadingCharacter: string | undefined;
let trailingCharacter: string | undefined;
let relativeOffsetForNextCharacterIteration: number = 0;

// MAIN
export function getSentencesFromCode(code: string): Sentence[] {
    sentences = [];

    // sentence
    charactersOfCurrentSentence = [];

    // current scope/block
    markerOfCurrentString = undefined;
    isCurrentlyInsideComment = false;
    isCurrentlyInsideAccessor = false;
    isEscaping = false;

    // loop over every character
    for (
        indexOfCurrentCharacter = 0;
        indexOfCurrentCharacter < code.length;
        indexOfCurrentCharacter++
    ) {
        relativeOffsetForNextCharacterIteration = 0;

        currentCharacter = code[indexOfCurrentCharacter];
        leadingCharacter = code[indexOfCurrentCharacter - 1];
        trailingCharacter = code[indexOfCurrentCharacter + 1];

        currentSentenceType = undefined;
        trailingSentence = undefined;

        let didRecognizeCharacter: boolean = false;
        const parseProcedure: CharacterRecognitionFunction[] = [
            recognizeComments,
            recognizeStrings,
            recognizeCalculations,
            recognizeBooleanOperators,
            recognizeAccessors,
            recognizeSentences,
            recognizeSentenceParts,
            recognizeAssignments,
            recognizeOther,
        ];
        for (let j = 0; j < parseProcedure.length; j++) {
            const functionToRun: CharacterRecognitionFunction =
                parseProcedure[j];
            didRecognizeCharacter = functionToRun();
            if (didRecognizeCharacter == true) break;
        }
        if (didRecognizeCharacter == false) {
            throw ERROR_NO_SENTENCE_RECOGNITION(indexOfCurrentCharacter);
        }

        isEscaping = currentCharacter == '\\' && !isEscaping;

        if (trailingSentence != undefined) {
            sentences.push(trailingSentence);
        }

        indexOfCurrentCharacter += relativeOffsetForNextCharacterIteration;
    }

    return sentences;
}

// HELPERS
// general
function closeCurrentSentence(shouldCleanString: boolean): void {
    if (currentSentenceType == undefined) {
        throw ERROR_NO_SENTENCE_TYPE(indexOfCurrentCharacter);
    }

    if (shouldCleanString == true) {
        charactersOfCurrentSentence = removeOuterSpacesFromCharacterArray(
            charactersOfCurrentSentence,
        );
    }

    const newSentence: Sentence = {
        rawTextCharacters: charactersOfCurrentSentence,
        type: currentSentenceType,
    };
    sentences.push(newSentence);

    resetCurrentSentence();
}

function resetCurrentSentence(): void {
    currentSentenceType = undefined;
    charactersOfCurrentSentence = [];
}

// recognition
type CharacterRecognitionFunction = () => boolean;

function recognizeAccessors(): boolean {
    if (isCurrentlyInsideAccessor == true) {
        if (currentCharacter == ']') {
            isCurrentlyInsideAccessor = false;
            closeCurrentSentence(true);
        } else {
            charactersOfCurrentSentence.push(currentCharacter);
        }

        return true;
    } else {
        if (currentCharacter != '[') return false;

        currentSentenceType = 'accessor';
        isCurrentlyInsideAccessor = true;
        return true;
    }
}

function recognizeAssignments(): boolean {
    if (leadingCharacter != ' ') return false;
    if (trailingCharacter != ' ') return false;
    if (currentCharacter != '=') return false;

    currentSentenceType = 'assignment-key';
    closeCurrentSentence(true);

    return true;
}

function recognizeBooleanOperators(): boolean {
    if (currentCharacter == '!') {
        currentSentenceType = 'boolean-operator-not';
        closeCurrentSentence(true);
        return true;
    }

    if (currentCharacter == trailingCharacter) {
        let sentenceType: SentenceType | undefined = undefined;
        switch (currentCharacter) {
            case '&': {
                sentenceType = 'boolean-operator-and';
                break;
            }
            case '|': {
                sentenceType = 'boolean-operator-or';
                break;
            }
        }

        if (sentenceType == undefined) return false;

        trailingSentence = {
            type: sentenceType,
            rawTextCharacters: [],
        };

        currentSentenceType = 'unknown';
        closeCurrentSentence(true);

        relativeOffsetForNextCharacterIteration = 1;

        return true;
    }

    return false;
}

function recognizeCalculations(): boolean {
    if (leadingCharacter != ' ') return false;

    const trailingCharacterIsEqualitySign: boolean = trailingCharacter == '=';

    let calculationDraft: string | undefined = undefined;
    let comparisonDraft: string | undefined = undefined;

    switch (currentCharacter) {
        case '+': {
            calculationDraft = 'add';
            break;
        }
        case '-': {
            calculationDraft = 'subtract';
            break;
        }
        case '*': {
            calculationDraft = 'multiply';
            break;
        }
        case '/': {
            calculationDraft = 'divide';
            break;
        }
        case '<': {
            comparisonDraft = 'lower';
            break;
        }
        case '>': {
            comparisonDraft = 'greater';
            break;
        }
        case '!': {
            comparisonDraft = 'not';
            break;
        }
        case '=': {
            if (trailingCharacterIsEqualitySign == false) break;
            comparisonDraft = 'is';
            break;
        }
        default: {
            return false;
        }
    }

    // TODO IMPLEMENT TESTS
    function closeCalculation(newSentenceType: string): boolean {
        currentSentenceType = 'unknown';
        closeCurrentSentence(true);

        // this block type-checks at runtime, requiring the any
        // unit test should be performed when building for safety
        if (calculationTypeArray.includes(newSentenceType as any) == false) {
            throw ERROR_NO_CALCULATION_TYPE(newSentenceType);
        }

        if (trailingCharacterIsEqualitySign == true) {
            relativeOffsetForNextCharacterIteration = 1;
        }

        // newSentenceType was type-checked above
        trailingSentence = {
            type: newSentenceType as CalculationType,
            rawTextCharacters: [],
        };
        return true;
    }

    if (calculationDraft != undefined) {
        let newSentenceTypePart: string = calculationDraft;
        if (trailingCharacterIsEqualitySign == true) {
            newSentenceTypePart = `assignment-${newSentenceTypePart}`;
        }
        return closeCalculation(`calculation-${newSentenceTypePart}`);
    } else if (comparisonDraft != undefined) {
        let newSentenceType: string = `calculation-comparison-${comparisonDraft}`;
        if (trailingCharacterIsEqualitySign == true) {
            newSentenceType = `${newSentenceType}-equal`;
        }
        return closeCalculation(newSentenceType);
    } else {
        return false;
    }
}

function recognizeComments(): boolean {
    if (isCurrentlyInsideComment == true) {
        if (currentCharacter == '\n') {
            currentSentenceType = 'comment';
            isCurrentlyInsideComment = false;
            closeCurrentSentence(false);
        } else {
            charactersOfCurrentSentence.push(currentCharacter);
        }

        return true;
    } else if (currentCharacter == '#') {
        //delete start of previous sentence and start comment
        resetCurrentSentence();
        isCurrentlyInsideComment = true;

        return true;
    } else {
        return false;
    }
}

function recognizeSentences(): boolean {
    if (currentCharacter != ';' && currentCharacter != ':') return false;

    switch (currentCharacter) {
        case ';': {
            currentSentenceType = 'closing';
            break;
        }
        case ':': {
            currentSentenceType = 'opening';
            break;
        }
    }

    closeCurrentSentence(true);

    return true;
}

function recognizeSentenceParts(): boolean {
    if (currentCharacter != ',') return false;

    currentSentenceType = 'enumerating';
    closeCurrentSentence(true);

    return true;
}

function recognizeStrings(): boolean {
    if (
        (currentCharacter != '"' && currentCharacter != "'") ||
        isEscaping == true
    ) {
        // character is not string marker

        // add character if inside string
        if (markerOfCurrentString == undefined) return false;

        charactersOfCurrentSentence.push(currentCharacter);
        return true;
    }

    switch (currentCharacter) {
        case '"': {
            currentSentenceType = 'safe-string';
            break;
        }
        case "'": {
            currentSentenceType = 'normal-string';
            break;
        }
    }

    if (markerOfCurrentString == undefined) {
        markerOfCurrentString = currentCharacter;
        //delete start of previous sentence and start new string
        resetCurrentSentence();
    } else if (markerOfCurrentString == currentCharacter) {
        markerOfCurrentString = undefined;
        closeCurrentSentence(false);
    } else {
        //string marker for diffent string type, treat as string content
        charactersOfCurrentSentence.push(currentCharacter);
    }

    return true;
}

function recognizeOther(): boolean {
    switch (currentCharacter) {
        case ' ':
        case '\t':
            {
            }
            currentCharacter = ' ';
    }

    // check if character should be added to sentence text
    const characterIsSpace: boolean = checkIfCharacterIsSpace(currentCharacter);
    const leadingCharacterIsSpace: boolean =
        leadingCharacter != undefined &&
        checkIfCharacterIsSpace(leadingCharacter);
    const characterShouldBeIgnored: boolean =
        characterIsSpace == true && leadingCharacterIsSpace == true;

    if (characterShouldBeIgnored) return true;
    charactersOfCurrentSentence.push(currentCharacter);
    return true;
}
