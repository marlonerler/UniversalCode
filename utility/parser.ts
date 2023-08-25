#!/usr/bin/env node

import { MultiwordPhraseParts } from '../types/parser';

export function getPartsOfPMultiwordPhrase(
    phraseCharaccters: string[],
): MultiwordPhraseParts {
    const phraseParts: MultiwordPhraseParts = {
        head: [],
        body: [],
    };
    let didPassFirstWhitespace: boolean = false;

    for (let i = 0; i < phraseCharaccters.length; i++) {
        const character: string = phraseCharaccters[i];

        if (didPassFirstWhitespace == true) {
            phraseParts.body.push(character);
        } else if (character == ' ') {
            // first whitespace separates head from body
            didPassFirstWhitespace = true;
        } else {
            phraseParts.head.push(character);
        }
    }

    return phraseParts;
}

export function getValueOfBooleanString(boolean: 'true' | 'false'): 0 | 1 {
    if (boolean == 'true') {
        return 1;
    } else {
        return 0;
    }
}
