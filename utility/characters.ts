#!/usr/bin/env node

export function checkIfCharacterIsSpace(character: string): boolean {
    return character == ' ' || character == '\t';
}

export function removeOuterSpacesFromString(stringToClean: string): string {
    let didRemoveAllLeadingSpaces: boolean = false;
    let didRemoveAllTrailingSpaces: boolean = false;

    let indicesOfCharactersToRemove: number[] = [];
    let cleanedString: string = '';

    //collect indices of outer spaces
    for (let indexFromStart: number = 0; indexFromStart < stringToClean.length; indexFromStart++) {
        let indexFromEnd: number = stringToClean.length - 1 - indexFromStart;

        if (didRemoveAllLeadingSpaces == false) {
            const currentLeadingCharacter: string = stringToClean[indexFromStart];
            if (checkIfCharacterIsSpace(currentLeadingCharacter) == false) {
                didRemoveAllLeadingSpaces = true;
                continue;
            };

            indicesOfCharactersToRemove.push(indexFromStart);
        }
        if (didRemoveAllTrailingSpaces == false) {
            const currentTrailingCharacter: string = stringToClean[indexFromEnd];
            if (checkIfCharacterIsSpace(currentTrailingCharacter) == false) {
                didRemoveAllTrailingSpaces = true;
                continue;
            };

            indicesOfCharactersToRemove.push(indexFromEnd);
        }
    }

    // rebuild string without outer spaces
    for (let i = 0; i < stringToClean.length; i++) {
        if (indicesOfCharactersToRemove.indexOf(i) > -1) continue;

        cleanedString += stringToClean[i];
    }

    return cleanedString;
}