#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeOuterSpacesFromCharacterArray = exports.checkIfCharacterIsSpace = void 0;
function checkIfCharacterIsSpace(character) {
    return character == ' ' || character == '\t';
}
exports.checkIfCharacterIsSpace = checkIfCharacterIsSpace;
function removeOuterSpacesFromCharacterArray(characterArray) {
    let didRemoveAllLeadingSpaces = false;
    let didRemoveAllTrailingSpaces = false;
    const indicesOfCharactersToRemove = new Set();
    const cleanedStringCharacters = [];
    //collect indices of outer spaces
    for (let indexFromStart = 0; indexFromStart < characterArray.length; indexFromStart++) {
        let indexFromEnd = characterArray.length - 1 - indexFromStart;
        if (didRemoveAllLeadingSpaces == false) {
            const currentLeadingCharacter = characterArray[indexFromStart];
            if (checkIfCharacterIsSpace(currentLeadingCharacter) == false) {
                didRemoveAllLeadingSpaces = true;
                continue;
            }
            ;
            indicesOfCharactersToRemove.add(indexFromStart);
        }
        if (didRemoveAllTrailingSpaces == false) {
            const currentTrailingCharacter = characterArray[indexFromEnd];
            if (checkIfCharacterIsSpace(currentTrailingCharacter) == false) {
                didRemoveAllTrailingSpaces = true;
                continue;
            }
            ;
            indicesOfCharactersToRemove.add(indexFromEnd);
        }
        if (didRemoveAllLeadingSpaces && didRemoveAllTrailingSpaces) {
            break;
        }
    }
    // rebuild string without outer spaces
    for (let i = 0; i < characterArray.length; i++) {
        if (indicesOfCharactersToRemove.has(i) == true)
            continue;
        cleanedStringCharacters.push(characterArray[i]);
    }
    return cleanedStringCharacters;
}
exports.removeOuterSpacesFromCharacterArray = removeOuterSpacesFromCharacterArray;
