#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseUnicCode = void 0;
const characters_1 = require("../utility/characters");
// MAIN
function parseUnicCode(code) {
    const rawStatements = splitCodeIntoRawStatements(code);
    console.log(rawStatements);
    throw 'incomplete';
}
exports.parseUnicCode = parseUnicCode;
function splitCodeIntoRawStatements(code) {
    const statements = [];
    let indexOfCurrentStatement = 0;
    let textOfCurrentStatement = '';
    let isCurrentlyInString = false;
    //loop over every character
    for (let i = 0; i < code.length; i++) {
        let character = code[i];
        let rawStatementType;
        function closeStatement(shouldCleanString) {
            if (rawStatementType == undefined) {
                throw `Unknown error: could not determine type of statement (character at index ${i})`;
            }
            if (shouldCleanString == true) {
                textOfCurrentStatement = (0, characters_1.removeOuterSpacesFromString)(textOfCurrentStatement);
            }
            const newStatement = {
                rawText: textOfCurrentStatement,
                type: rawStatementType,
            };
            statements[indexOfCurrentStatement] = newStatement;
            clearStatement();
        }
        function clearStatement() {
            indexOfCurrentStatement++;
            textOfCurrentStatement = '';
        }
        if (character == '.' || character == ':') {
            switch (character) {
                case '.': {
                    rawStatementType = 'closed';
                    break;
                }
                case ':': {
                    rawStatementType = 'open';
                    break;
                }
            }
            closeStatement(true);
        }
        else if (character == '"' || character == '\'') {
            switch (character) {
                case '"': {
                    rawStatementType = 'string-safe';
                    break;
                }
                case '\'': {
                    rawStatementType = 'string-normal';
                    break;
                }
            }
            isCurrentlyInString = !isCurrentlyInString;
            if (isCurrentlyInString == true) {
                clearStatement();
                continue;
            }
            closeStatement(false);
        }
        else {
            if (character == '\n' && isCurrentlyInString == false) {
                //do not preserve newlines outside strings
                character = ' ';
            }
            // check if character should be added to statement text
            const leadingCharacter = code[i - 1];
            const characterIsSpace = (0, characters_1.checkIfCharacterIsSpace)(character);
            const leadingCharacterIsSpace = leadingCharacter != undefined && (0, characters_1.checkIfCharacterIsSpace)(leadingCharacter);
            const characterShouldBeIgnoredUnlessInString = characterIsSpace == true && leadingCharacterIsSpace == true;
            const characterIsTextOfStatement = !characterShouldBeIgnoredUnlessInString || isCurrentlyInString;
            if (characterIsTextOfStatement) {
                textOfCurrentStatement += character;
            }
        }
    }
    return statements;
}
