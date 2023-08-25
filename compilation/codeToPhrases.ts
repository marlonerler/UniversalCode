#!/usr/bin/env node
import { ERROR_NO_PHRASE_RECOGNITION, ERROR_NO_PHRASE_TYPE } from "../constants/errors";
import { Phrase, PhraseType } from "../types/parser";
import { checkIfCharacterIsSpace, removeOuterSpacesFromCharacterArray } from "../utility/characters";

// DATA
let phrases: Phrase[];

// current phrase
let charactersOfCurrentPhrase: string[];
let phraseType: PhraseType | undefined;

// current scope/block
let markerOfCurrentString: string | undefined;
let isCurrentlyInsideComment: boolean;
let isEscaping: boolean;

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
    for (let i: number = 0; i < code.length; i++) {
        let character: string = code[i];
        const leadingCharacter: string | undefined = code[i - 1];

        let couldClassifyCharacter: boolean = false;
        const parseProcedure: characterRecognitionFunction[] = [
            recognizeString,
            recognizeComment,
            recognizeSentence,
            recognizeSentencePart,
            recognizeAssignment,
            recognizeOther,
        ]
        for (let j = 0; j < parseProcedure.length; j++) {
            const functionToRun: characterRecognitionFunction = parseProcedure[j];
            couldClassifyCharacter = functionToRun(i, character, leadingCharacter);
            if (couldClassifyCharacter == true) break;
        }
        if (couldClassifyCharacter == false) {
            throw ERROR_NO_PHRASE_RECOGNITION(i);
        }

        isEscaping = (character == '\\' && leadingCharacter != '\\');
    }

    return phrases;
}

// HELPERS
// general
function closeCurrentPhrase(indexOfCurrentCharacter: number, shouldCleanString: boolean): void {
    if (phraseType == undefined) {
        throw ERROR_NO_PHRASE_TYPE(indexOfCurrentCharacter);
    }

    if (charactersOfCurrentPhrase.length == 0) {
        //do not add empty phrases
        resetCurrentPhrase();
        return;
    }

    if (shouldCleanString == true) {
        charactersOfCurrentPhrase = removeOuterSpacesFromCharacterArray(charactersOfCurrentPhrase);
    }

    const newPhrase: Phrase = {
        rawTextCharacters: charactersOfCurrentPhrase,
        type: phraseType,
    }
    phrases.push(newPhrase);

    resetCurrentPhrase();
}

function resetCurrentPhrase(): void {
    phraseType = undefined;
    charactersOfCurrentPhrase = [];
}

// recognition
type characterRecognitionFunction = (indexOfCurrentCharacter: number, character: string, leadingCharacter: string) => boolean;

function recognizeAssignment(indexOfCurrentCharacter: number, character: string, leadingCharacter: string): boolean {
    if (character != '=') return false;

    phraseType = 'assignment-key';
    closeCurrentPhrase(indexOfCurrentCharacter, true);

    return true;
}

function recognizeComment(indexOfCurrentCharacter: number, character: string, leadingCharacter: string): boolean {
    if (isCurrentlyInsideComment == true) {
        if (character == '\n') {
            phraseType = 'comment';
            isCurrentlyInsideComment = false;
            closeCurrentPhrase(indexOfCurrentCharacter, false);
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

function recognizeSentence(indexOfCurrentCharacter: number, character: string, leadingCharacter: string): boolean {
    if (character != '.' && character != ':') return false;

    switch (character) {
        case '.': {
            phraseType = 'closing';
            break;
        }
        case ':': {
            phraseType = 'introducing';
            break;
        }
    }

    closeCurrentPhrase(indexOfCurrentCharacter, true);

    return true;
}

function recognizeSentencePart(indexOfCurrentCharacter: number, character: string, leadingCharacter: string): boolean {
    if (character == ',') {
        phraseType = 'continuing';
        closeCurrentPhrase(indexOfCurrentCharacter, true);

        return true;
    } else if (character == ';') {
        phraseType = 'separating';
        closeCurrentPhrase(indexOfCurrentCharacter, true);

        return true;
    } else {
        return false;
    }
}

function recognizeString(indexOfCurrentCharacter: number, character: string, leadingCharacter: string): boolean {
    if ((character != '"' && character != '\'') || isEscaping == true) {
        // character is not string marker

        // add character if inside string
        if (markerOfCurrentString != undefined) {
            charactersOfCurrentPhrase.push(character);
            return true;
        } else {
            return false;
        }
    };

    switch (character) {
        case '"': {
            phraseType = 'safe-string';
            break;
        }
        case '\'': {
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
        closeCurrentPhrase(indexOfCurrentCharacter, false);
    } else {
        //string marker for diffent string type, treat as string content
        charactersOfCurrentPhrase.push(character);
    }

    return true;
}

function recognizeOther(indexOfCurrentCharacter: number, character: string, leadingCharacter: string): boolean {
    if (character == '\n') {
        //do not preserve newlines
        character = ' ';
    }

    // check if character should be added to phrase text
    const characterIsSpace: boolean = checkIfCharacterIsSpace(character);
    const leadingCharacterIsSpace: boolean = leadingCharacter != undefined && checkIfCharacterIsSpace(leadingCharacter);
    const characterShouldBeIgnored: boolean = characterIsSpace == true && leadingCharacterIsSpace == true;

    if (characterShouldBeIgnored) return true;
    charactersOfCurrentPhrase.push(character);
    return true;
}