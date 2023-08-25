#!/usr/bin/env node
import {
    ERROR_NO_PHRASE_RECOGNITION,
    ERROR_NO_PHRASE_TYPE,
} from '../constants/errors';
import { Phrase, PhraseType } from '../types/parser';
import {
    checkIfCharacterIsSpace,
    removeOuterSpacesFromCharacterArray,
} from '../utility/characters';

// DATA
let phrases: Phrase[];

// current phrase
let charactersOfCurrentPhrase: string[];
let phraseType: PhraseType | undefined;

// current scope/block
let markerOfCurrentString: string | undefined;
let isCurrentlyInsideComment: boolean;
let isEscaping: boolean;

// tracking loop
let indexOfCurrentCharacter: number = 0;
let character: string = '';
let leadingCharacter: string | undefined;

// MAIN
export function getPhrasesFromCode(code: string): Phrase[] {
    phrases = [];

    // current phrase
    charactersOfCurrentPhrase = [];
    phraseType = undefined;

    // current scope/block
    markerOfCurrentString = undefined;
    isCurrentlyInsideComment = false;
    isEscaping = false;

    // loop over every character
    for (
        indexOfCurrentCharacter = 0;
        indexOfCurrentCharacter < code.length;
        indexOfCurrentCharacter++
    ) {
        character = code[indexOfCurrentCharacter];
        leadingCharacter = code[indexOfCurrentCharacter - 1];

        let couldClassifyCharacter: boolean = false;
        const parseProcedure: characterRecognitionFunction[] = [
            recognizeString,
            recognizeComment,
            recognizeSentence,
            recognizeSentencePart,
            recognizeAssignment,
            recognizeOther,
        ];
        for (let j = 0; j < parseProcedure.length; j++) {
            const functionToRun: characterRecognitionFunction =
                parseProcedure[j];
            couldClassifyCharacter = functionToRun();
            if (couldClassifyCharacter == true) break;
        }
        if (couldClassifyCharacter == false) {
            throw ERROR_NO_PHRASE_RECOGNITION(indexOfCurrentCharacter);
        }

        isEscaping = character == '\\' && leadingCharacter != '\\';
    }

    return phrases;
}

// HELPERS
// general
function closeCurrentPhrase(
    shouldCleanString: boolean,
): void {
    if (phraseType == undefined) {
        throw ERROR_NO_PHRASE_TYPE(indexOfCurrentCharacter);
    }

    if (charactersOfCurrentPhrase.length == 0) {
        //do not add empty phrases
        resetCurrentPhrase();
        return;
    }

    if (shouldCleanString == true) {
        charactersOfCurrentPhrase = removeOuterSpacesFromCharacterArray(
            charactersOfCurrentPhrase,
        );
    }

    const newPhrase: Phrase = {
        rawTextCharacters: charactersOfCurrentPhrase,
        type: phraseType,
    };
    phrases.push(newPhrase);

    resetCurrentPhrase();
}

function resetCurrentPhrase(): void {
    phraseType = undefined;
    charactersOfCurrentPhrase = [];
}

// recognition
type characterRecognitionFunction = () => boolean;

function recognizeAssignment(): boolean {
    if (character != '=') return false;

    phraseType = 'assignment-key';
    closeCurrentPhrase(true);

    return true;
}

function recognizeComment(): boolean {
    if (isCurrentlyInsideComment == true) {
        if (character == '\n') {
            phraseType = 'comment';
            isCurrentlyInsideComment = false;
            closeCurrentPhrase(false);
        } else {
            charactersOfCurrentPhrase.push(character);
        }

        return true;
    } else if (character == '#') {
        //delete start of previous phrase and start comment
        resetCurrentPhrase();
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
            phraseType = 'closing';
            break;
        }
        case ':': {
            phraseType = 'introducing';
            break;
        }
    }

    closeCurrentPhrase(true);

    return true;
}

function recognizeSentencePart(): boolean {
    if (character != ',') return false;
    
    phraseType = 'continuing';
    closeCurrentPhrase(true);

    return true;
}

function recognizeString(): boolean {
    if ((character != '"' && character != "'") || isEscaping == true) {
        // character is not string marker

        // add character if inside string
        if (markerOfCurrentString != undefined) {
            charactersOfCurrentPhrase.push(character);
            return true;
        } else {
            return false;
        }
    }

    switch (character) {
        case '"': {
            phraseType = 'safe-string';
            break;
        }
        case "'": {
            phraseType = 'normal-string';
            break;
        }
    }

    if (markerOfCurrentString == undefined) {
        markerOfCurrentString = character;
        //delete start of previous phrase and start new string
        resetCurrentPhrase();
    } else if (markerOfCurrentString == character) {
        markerOfCurrentString = undefined;
        closeCurrentPhrase(false);
    } else {
        //string marker for diffent string type, treat as string content
        charactersOfCurrentPhrase.push(character);
    }

    return true;
}

function recognizeOther(): boolean {
    if (character == '\n') {
        //do not preserve newlines
        character = ' ';
    }

    // check if character should be added to phrase text
    const characterIsSpace: boolean = checkIfCharacterIsSpace(character);
    const leadingCharacterIsSpace: boolean =
        leadingCharacter != undefined &&
        checkIfCharacterIsSpace(leadingCharacter);
    const characterShouldBeIgnored: boolean =
        characterIsSpace == true && leadingCharacterIsSpace == true;

    if (characterShouldBeIgnored) return true;
    charactersOfCurrentPhrase.push(character);
    return true;
}
