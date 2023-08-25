#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseUnicCode = void 0;
// IMPORTS
const errors_1 = require("../constants/errors");
const characters_1 = require("../utility/characters");
// MAIN
function parseUnicCode(code) {
    const phrases = getPhrasesFromCode(code);
    console.log(phrases);
    throw 'incomplete';
}
exports.parseUnicCode = parseUnicCode;
function getPhrasesFromCode(code) {
    const phrases = [];
    let indexOfCurrentPhrase = 0;
    let charactersOfCurrentPhrase = [];
    let markerOfCurrentString = undefined;
    //loop over every character
    for (let i = 0; i < code.length; i++) {
        let character = code[i];
        let endMarker;
        function closeCurrentPhrase(shouldCleanString) {
            if (endMarker == undefined) {
                throw (0, errors_1.ERR_NO_STATEMENT_TYPE)(i);
            }
            if (charactersOfCurrentPhrase.length == 0) {
                //do not add empty statements
                resetCurrentPhrase(false);
                return;
            }
            let textOfCurrentPhrase = charactersOfCurrentPhrase.join('');
            if (shouldCleanString == true) {
                textOfCurrentPhrase = (0, characters_1.removeOuterSpacesFromString)(textOfCurrentPhrase);
            }
            const newPhrase = {
                rawText: textOfCurrentPhrase,
                endMarker: endMarker,
            };
            phrases[indexOfCurrentPhrase] = newPhrase;
            resetCurrentPhrase(true);
        }
        function resetCurrentPhrase(shouldIncreaseIndex) {
            if (shouldIncreaseIndex)
                indexOfCurrentPhrase++;
            charactersOfCurrentPhrase = [];
        }
        if (character == '"' || character == '\'') {
            switch (character) {
                case '"': {
                    endMarker = 'safe-string-marker';
                    break;
                }
                case '\'': {
                    endMarker = 'normal-string-marker';
                    break;
                }
            }
            if (markerOfCurrentString == undefined) {
                markerOfCurrentString = character;
                //delete start of previous phrase and start new string
                resetCurrentPhrase(false);
                continue;
            }
            else if (markerOfCurrentString == character) {
                markerOfCurrentString = undefined;
                closeCurrentPhrase(false);
            }
            else {
                charactersOfCurrentPhrase.push(character);
            }
        }
        else if (markerOfCurrentString != undefined) {
            charactersOfCurrentPhrase.push(character);
        }
        else if (character == '.' || character == ':') {
            switch (character) {
                case '.': {
                    endMarker = 'final-centence-end-marker';
                    break;
                }
                case ':': {
                    endMarker = 'opening-sentence-end-marker';
                    break;
                }
            }
            closeCurrentPhrase(true);
        }
        else if (character == ',') {
            endMarker = 'continuous-marker';
            closeCurrentPhrase(true);
        }
        else if (character == ';') {
            endMarker = 'separating-marker';
            closeCurrentPhrase(true);
        }
        else if (character == '=') {
            endMarker = 'assignment-marker';
            closeCurrentPhrase(true);
        }
        else {
            if (character == '\n') {
                //do not preserve newlines
                character = ' ';
            }
            // check if character should be added to statement text
            const leadingCharacter = code[i - 1];
            const characterIsSpace = (0, characters_1.checkIfCharacterIsSpace)(character);
            const leadingCharacterIsSpace = leadingCharacter != undefined && (0, characters_1.checkIfCharacterIsSpace)(leadingCharacter);
            const characterShouldBeIgnored = characterIsSpace == true && leadingCharacterIsSpace == true;
            if (characterShouldBeIgnored)
                continue;
            charactersOfCurrentPhrase.push(character);
        }
    }
    return phrases;
}
