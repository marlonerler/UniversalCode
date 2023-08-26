#!/usr/bin/env node

import { HeadAndBody } from '../types/parser';

export function getHeadAndBody(
    characters: string[],
): HeadAndBody {
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
