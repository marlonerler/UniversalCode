#!/usr/bin/env node

export function checkIfCharacterIsSpace(character: string): boolean {
    return character == ' ' || character == '\t';
}

export function removeOuterSpacesFromCharacterArray(
    characterArray: string[],
): string[] {
    let didRemoveAllLeadingSpaces: boolean = false;
    let didRemoveAllTrailingSpaces: boolean = false;

    const indicesOfCharactersToRemove: Set<number> = new Set();
    const cleanedStringCharacters: string[] = [];

    //collect indices of outer spaces
    for (
        let indexFromStart: number = 0;
        indexFromStart < characterArray.length;
        indexFromStart++
    ) {
        let indexFromEnd: number = characterArray.length - 1 - indexFromStart;

        if (didRemoveAllLeadingSpaces == false) {
            const currentLeadingCharacter: string =
                characterArray[indexFromStart];
            if (checkIfCharacterIsSpace(currentLeadingCharacter) == false) {
                didRemoveAllLeadingSpaces = true;
            } else {
                indicesOfCharactersToRemove.add(indexFromStart);
            }
        }
        if (didRemoveAllTrailingSpaces == false) {
            const currentTrailingCharacter: string =
                characterArray[indexFromEnd];
            if (checkIfCharacterIsSpace(currentTrailingCharacter) == false) {
                didRemoveAllTrailingSpaces = true;
            } else {
                indicesOfCharactersToRemove.add(indexFromEnd);
            }
        }

        if (didRemoveAllLeadingSpaces && didRemoveAllTrailingSpaces) {
            break;
        }
    }

    // rebuild string without outer spaces
    for (let i = 0; i < characterArray.length; i++) {
        if (indicesOfCharactersToRemove.has(i) == true) continue;

        cleanedStringCharacters.push(characterArray[i]);
    }

    return cleanedStringCharacters;
}
