#!/usr/bin/env node
import {
    ERROR_NO_SENTENCE_RECOGNITION,
    ERROR_NO_SENTENCE_TYPE,
} from '../constants/errors';
import { Sentence, SentenceType } from '../types/parser';
import {
    checkIfCharacterIsSpace,
    removeOuterSpacesFromCharacterArray,
} from '../utility/characters';

// DATA
let sentences: Sentence[];

// current sentence
let charactersOfCurrentSentence: string[];
let currentSentenceType: SentenceType | undefined;

// current scope/block
let markerOfCurrentString: string | undefined;
let isCurrentlyInsideComment: boolean;
let isCurrentlyInsideAccessor: boolean;
let isEscaping: boolean;

// tracking loop
let indexOfCurrentCharacter: number = 0;
let character: string = '';
let leadingCharacter: string | undefined;

// MAIN
export function getSentencesFromCode(code: string): Sentence[] {
    sentences = [];

    // current sentence
    charactersOfCurrentSentence = [];
    currentSentenceType = undefined;

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
        character = code[indexOfCurrentCharacter];
        leadingCharacter = code[indexOfCurrentCharacter - 1];

        let didRecognizeCharacter: boolean = false;
        const parseProcedure: CharacterRecognitionFunction[] = [
            recognizeComment,
            recognizeString,
            recognizeAccessor,
            recognizeSentence,
            recognizeSentencePart,
            recognizeAssignment,
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

        isEscaping = character == '\\' && !isEscaping;
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

function recognizeAccessor(): boolean {
    if (isCurrentlyInsideAccessor == true) {
        if (character == ']') {
            isCurrentlyInsideAccessor = false;
            closeCurrentSentence(true);
        } else {
            charactersOfCurrentSentence.push(character);
        }

        return true;
    } else {
        if (character != '[') return false;

        currentSentenceType = 'accessor';
        isCurrentlyInsideAccessor = true;
        return true;
    }
}

function recognizeAssignment(): boolean {
    if (character != '=') return false;

    currentSentenceType = 'assignment-key';
    closeCurrentSentence(true);

    return true;
}

function recognizeComment(): boolean {
    if (isCurrentlyInsideComment == true) {
        if (character == '\n') {
            currentSentenceType = 'comment';
            isCurrentlyInsideComment = false;
            closeCurrentSentence(false);
        } else {
            charactersOfCurrentSentence.push(character);
        }

        return true;
    } else if (character == '#') {
        //delete start of previous sentence and start comment
        resetCurrentSentence();
        isCurrentlyInsideComment = true;

        return true;
    } else {
        return false;
    }
}

function recognizeSentence(): boolean {
    if (character != ';' && character != ':') return false;

    switch (character) {
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

function recognizeSentencePart(): boolean {
    if (character != ',') return false;

    currentSentenceType = 'enumerating';
    closeCurrentSentence(true);

    return true;
}

function recognizeString(): boolean {
    if ((character != '"' && character != "'") || isEscaping == true) {
        // character is not string marker

        // add character if inside string
        if (markerOfCurrentString == undefined) return false;

        charactersOfCurrentSentence.push(character);
        return true;
    }

    switch (character) {
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
        markerOfCurrentString = character;
        //delete start of previous sentence and start new string
        resetCurrentSentence();
    } else if (markerOfCurrentString == character) {
        markerOfCurrentString = undefined;
        closeCurrentSentence(false);
    } else {
        //string marker for diffent string type, treat as string content
        charactersOfCurrentSentence.push(character);
    }

    return true;
}

function recognizeOther(): boolean {
    if (character == '\n') {
        //do not preserve newlines
        character = ' ';
    }

    // check if character should be added to sentence text
    const characterIsSpace: boolean = checkIfCharacterIsSpace(character);
    const leadingCharacterIsSpace: boolean =
        leadingCharacter != undefined &&
        checkIfCharacterIsSpace(leadingCharacter);
    const characterShouldBeIgnored: boolean =
        characterIsSpace == true && leadingCharacterIsSpace == true;

    if (characterShouldBeIgnored) return true;
    charactersOfCurrentSentence.push(character);
    return true;
}
