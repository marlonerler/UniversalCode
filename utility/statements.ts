#!/usr/bin/env node

import { IntroducingPhraseParts } from "../types/parser";

export function getPartsOfIntroducingStatement(statementTextCharacters: string[]): IntroducingPhraseParts {
    const statementParts: IntroducingPhraseParts = {
        head: [],
        body: [],
    };
    let didPassFirstWhitespace: boolean = false;

    for (let i = 0; i < statementTextCharacters.length; i++) {
        const character: string = statementTextCharacters[i];

        if (didPassFirstWhitespace == true) {
            statementParts.head.push(character);
        } else if (character == ' ') {
            // first whitespace separates head from body
            didPassFirstWhitespace = true
        } else {
            statementParts.body.push(character);
        }
    }

    return statementParts;
}