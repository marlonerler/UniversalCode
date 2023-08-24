#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeOuterSpacesFromString = exports.checkIfCharacterIsSpace = void 0;
function checkIfCharacterIsSpace(character) {
    return character == ' ' || character == '\t';
}
exports.checkIfCharacterIsSpace = checkIfCharacterIsSpace;
function removeOuterSpacesFromString(stringToClean) {
    let didRemoveAllLeadingSpaces = false;
    let didRemoveAllTrailingSpaces = false;
    let indicesOfCharactersToRemove = [];
    let cleanedString = '';
    //collect indices of outer spaces
    for (let indexFromStart = 0; indexFromStart < stringToClean.length; indexFromStart++) {
        let indexFromEnd = stringToClean.length - 1 - indexFromStart;
        if (didRemoveAllLeadingSpaces == false) {
            const currentLeadingCharacter = stringToClean[indexFromStart];
            if (checkIfCharacterIsSpace(currentLeadingCharacter) == false) {
                didRemoveAllLeadingSpaces = true;
                continue;
            }
            ;
            indicesOfCharactersToRemove.push(indexFromStart);
        }
        if (didRemoveAllTrailingSpaces == false) {
            const currentTrailingCharacter = stringToClean[indexFromEnd];
            if (checkIfCharacterIsSpace(currentTrailingCharacter) == false) {
                didRemoveAllTrailingSpaces = true;
                continue;
            }
            ;
            indicesOfCharactersToRemove.push(indexFromEnd);
        }
    }
    // rebuild string without outer spaces
    for (let i = 0; i < stringToClean.length; i++) {
        if (indicesOfCharactersToRemove.indexOf(i) > -1)
            continue;
        cleanedString += stringToClean[i];
    }
    return cleanedString;
}
exports.removeOuterSpacesFromString = removeOuterSpacesFromString;
