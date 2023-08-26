#!/usr/bin/env node

import { HeadAndBody } from '../types/parser';

export function getHeadAndBody(characters: string[]): HeadAndBody {
    const parts: HeadAndBody = {
        head: [],
        body: [],
    };
    let didPassFirstWhitespace: boolean = false;

    for (let i = 0; i < characters.length; i++) {
        const character: string = characters[i];

        if (didPassFirstWhitespace == true) {
            parts.body.push(character);
        } else if (character == ' ') {
            // first whitespace separates head from body
            didPassFirstWhitespace = true;
        } else {
            parts.head.push(character);
        }
    }

    return parts;
}

export function getValueOfBooleanString(boolean: 'true' | 'false'): 0 | 1 {
    if (boolean == 'true') {
        return 1;
    } else {
        return 0;
    }
}

const NUMBER_CHARACTERS: Set<string> = new Set([
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '0',
    '.',
]);
export function verifyIsNumber(potentialNumberCharacters: string[]): boolean {
    let didFindDecimalPoint: boolean = false;
    for (let i: number = 0; i < potentialNumberCharacters.length; i++) {
        const character = potentialNumberCharacters[i];
        if (NUMBER_CHARACTERS.has(character) == false) return false;

        if (character == '.') {
            if (didFindDecimalPoint == true) return false;
            didFindDecimalPoint = true;
        }
    }

    return true;
}
