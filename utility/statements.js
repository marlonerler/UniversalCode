#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPartsOfIntroducingStatement = void 0;
function getPartsOfIntroducingStatement(statementTextCharacters) {
    const statementParts = {
        head: [],
        body: [],
    };
    let didPassFirstWhitespace = false;
    for (let i = 0; i < statementTextCharacters.length; i++) {
        const character = statementTextCharacters[i];
        if (didPassFirstWhitespace == true) {
            statementParts.head.push(character);
        }
        else if (character == ' ') {
            // first whitespace separates head from body
            didPassFirstWhitespace = true;
        }
        else {
            statementParts.body.push(character);
        }
    }
    return statementParts;
}
exports.getPartsOfIntroducingStatement = getPartsOfIntroducingStatement;
