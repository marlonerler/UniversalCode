#!/usr/bin/env node
import { ERROR_NO_RECOGNITION, ERROR_NO_PHRASE_TYPE } from "../constants/errors";
import { Phrase, PhraseType } from "../types/parser";
import { checkIfCharacterIsSpace, removeOuterSpacesFromCharacterArray } from "../utility/characters";

// DATA
let phrases: Phrase[];

// current phrase
let indexOfCurrentPhrase: number;
let charactersOfCurrentPhrase: string[];
let phraseType: PhraseType;

// current scope/block
let markerOfCurrentString: string | undefined;
let isCurrentlyInsideComment: boolean;
let isEscaping: boolean;

// MAIN
export function getPhrasesFromCode(code: string): Phrase[] {
    phrases = [];

    // current phrase
    indexOfCurrentPhrase = 0;
    charactersOfCurrentPhrase = [];

    // current scope/block
    markerOfCurrentString = undefined;
    isCurrentlyInsideComment = false;
    isEscaping = false;

    // loop over every character
    for (let i: number = 0; i < code.length; i++) {
        let character: string = code[i];
        const leadingCharacter: string | undefined = code[i - 1];

        let couldClassifyCharacter: boolean = false;
        const parseProcedure: recognitionFunction[] = [
            processForString,
            processForComment,
            processForSentence,
            processForSentencePart,
            processForAssignment,
            processGenericCharacter,
        ]
        for (let j = 0; j < parseProcedure.length; j++) {
            const functionToRun: recognitionFunction = parseProcedure[j];
            couldClassifyCharacter = functionToRun(i, character, leadingCharacter);
            if (couldClassifyCharacter == true) break;
        }
        if (couldClassifyCharacter == false) {
            throw ERROR_NO_RECOGNITION(i);
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
        //do not add empty statements
        resetCurrentPhrase(false);
        return;
    }

    if (shouldCleanString == true) {
        charactersOfCurrentPhrase = removeOuterSpacesFromCharacterArray(charactersOfCurrentPhrase);
    }

    const newPhrase: Phrase = {
        rawTextCharacters: charactersOfCurrentPhrase,
        type: phraseType,
    }
    phrases[indexOfCurrentCharacter] = newPhrase;

    resetCurrentPhrase(true);
}

function resetCurrentPhrase(shouldIncreaseIndex: boolean): void {
    if (shouldIncreaseIndex) indexOfCurrentPhrase++;
    charactersOfCurrentPhrase = [];
}

// recognition
type recognitionFunction = (indexOfCurrentCharacter: number, character: string, leadingCharacter: string) => boolean;

function processForAssignment(indexOfCurrentCharacter: number, character: string, leadingCharacter: string): boolean {
    if (character != '=') return false;

    phraseType = 'assignment-key';
    closeCurrentPhrase(indexOfCurrentCharacter, true);

    return true;
}

function processForComment(indexOfCurrentCharacter: number, character: string, leadingCharacter: string): boolean {
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
        isCurrentlyInsideComment = true;

        return true;
    } else {
        return false;
    }
}

function processForSentence(indexOfCurrentCharacter: number, character: string, leadingCharacter: string): boolean {
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

function processForSentencePart(indexOfCurrentCharacter: number, character: string, leadingCharacter: string): boolean {
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

function processForString(indexOfCurrentCharacter: number, character: string, leadingCharacter: string): boolean {
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
        resetCurrentPhrase(false);
    } else if (markerOfCurrentString == character) {
        markerOfCurrentString = undefined;
        closeCurrentPhrase(indexOfCurrentCharacter, false);
    } else {
        //string marker for diffent string type, treat as string content
        charactersOfCurrentPhrase.push(character);
    }

    return true;
}

function processGenericCharacter(indexOfCurrentCharacter: number, character: string, leadingCharacter: string): boolean {
    if (character == '\n') {
        //do not preserve newlines
        character = ' ';
    }

    // check if character should be added to statement text
    const characterIsSpace: boolean = checkIfCharacterIsSpace(character);
    const leadingCharacterIsSpace: boolean = leadingCharacter != undefined && checkIfCharacterIsSpace(leadingCharacter);
    const characterShouldBeIgnored: boolean = characterIsSpace == true && leadingCharacterIsSpace == true;

    if (characterShouldBeIgnored) return true;
    charactersOfCurrentPhrase.push(character);
    return true;
}