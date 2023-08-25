#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPhrasesFromCode = void 0;
const errors_1 = require("../constants/errors");
const characters_1 = require("../utility/characters");
// DATA
let phrases;
// current phrase
let indexOfCurrentPhrase;
let charactersOfCurrentPhrase;
let phraseType;
// current scope/block
let markerOfCurrentString;
let isCurrentlyInsideComment;
let isEscaping;
// MAIN
function getPhrasesFromCode(code) {
    phrases = [];
    // current phrase
    indexOfCurrentPhrase = 0;
    charactersOfCurrentPhrase = [];
    // current scope/block
    markerOfCurrentString = undefined;
    isCurrentlyInsideComment = false;
    isEscaping = false;
    // loop over every character
    for (let i = 0; i < code.length; i++) {
        let character = code[i];
        const leadingCharacter = code[i - 1];
        let couldClassifyCharacter = false;
        const parseProcedure = [
            processForString,
            processForComment,
            processForSentence,
            processForSentencePart,
            processForAssignment,
            processGenericCharacter,
        ];
        for (let j = 0; j < parseProcedure.length; j++) {
            const nextFunction = parseProcedure[j];
            couldClassifyCharacter = nextFunction(i, character, leadingCharacter);
            if (couldClassifyCharacter == true)
                break;
        }
        if (couldClassifyCharacter == false) {
            console.error('DID NOT RECOGNIZE'); //TODO
        }
        isEscaping = (character == '\\' && leadingCharacter != '\\');
    }
    return phrases;
}
exports.getPhrasesFromCode = getPhrasesFromCode;
// HELPERS
// general
function closeCurrentPhrase(indexOfCurrentCharacter, shouldCleanString) {
    if (phraseType == undefined) {
        throw (0, errors_1.ERR_NO_PHRASE_TYPE)(indexOfCurrentCharacter);
    }
    if (charactersOfCurrentPhrase.length == 0) {
        //do not add empty statements
        resetCurrentPhrase(false);
        return;
    }
    if (shouldCleanString == true) {
        charactersOfCurrentPhrase = (0, characters_1.removeOuterSpacesFromCharacterArray)(charactersOfCurrentPhrase);
    }
    const newPhrase = {
        rawTextCharacters: charactersOfCurrentPhrase,
        type: phraseType,
    };
    phrases[indexOfCurrentCharacter] = newPhrase;
    console.log(phraseType, charactersOfCurrentPhrase.join(''));
    resetCurrentPhrase(true);
}
function resetCurrentPhrase(shouldIncreaseIndex) {
    if (shouldIncreaseIndex)
        indexOfCurrentPhrase++;
    charactersOfCurrentPhrase = [];
}
function processForAssignment(indexOfCurrentCharacter, character, leadingCharacter) {
    if (character != '=')
        return false;
    phraseType = 'assignment-key';
    closeCurrentPhrase(indexOfCurrentCharacter, true);
    return true;
}
function processForComment(indexOfCurrentCharacter, character, leadingCharacter) {
    if (isCurrentlyInsideComment == true) {
        if (character == '\n') {
            phraseType = 'comment';
            isCurrentlyInsideComment = false;
            closeCurrentPhrase(indexOfCurrentCharacter, false);
        }
        else {
            charactersOfCurrentPhrase.push(character);
        }
        return true;
    }
    else if (character == '#') {
        isCurrentlyInsideComment = true;
        return true;
    }
    else {
        return false;
    }
}
function processForSentence(indexOfCurrentCharacter, character, leadingCharacter) {
    if (character != '.' && character != ':')
        return false;
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
function processForSentencePart(indexOfCurrentCharacter, character, leadingCharacter) {
    if (character == ',') {
        phraseType = 'continuing';
        closeCurrentPhrase(indexOfCurrentCharacter, true);
        return true;
    }
    else if (character == ';') {
        phraseType = 'separating';
        closeCurrentPhrase(indexOfCurrentCharacter, true);
        return true;
    }
    else {
        return false;
    }
}
function processForString(indexOfCurrentCharacter, character, leadingCharacter) {
    if ((character != '"' && character != '\'') || isEscaping == true) {
        // character is not string marker
        // add character if inside string
        if (markerOfCurrentString != undefined) {
            charactersOfCurrentPhrase.push(character);
            return true;
        }
        else {
            return false;
        }
    }
    ;
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
    }
    else if (markerOfCurrentString == character) {
        markerOfCurrentString = undefined;
        closeCurrentPhrase(indexOfCurrentCharacter, false);
    }
    else {
        //string marker for diffent string type, treat as string content
        charactersOfCurrentPhrase.push(character);
    }
    return true;
}
function processGenericCharacter(indexOfCurrentCharacter, character, leadingCharacter) {
    if (character == '\n') {
        //do not preserve newlines
        character = ' ';
    }
    // check if character should be added to statement text
    const characterIsSpace = (0, characters_1.checkIfCharacterIsSpace)(character);
    const leadingCharacterIsSpace = leadingCharacter != undefined && (0, characters_1.checkIfCharacterIsSpace)(leadingCharacter);
    const characterShouldBeIgnored = characterIsSpace == true && leadingCharacterIsSpace == true;
    if (characterShouldBeIgnored)
        return true;
    charactersOfCurrentPhrase.push(character);
    return true;
}
