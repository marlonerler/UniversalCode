#!/usr/bin/env node

// IMPORTS
import { ERR_NO_STATEMENT_TYPE } from "../constants/errors";
import { ParseResult, Phrase, PhraseTypes } from "../types/parser";
import { checkIfCharacterIsSpace, removeOuterSpacesFromString } from "../utility/characters";

// MAIN
export function parseUnicCode(code: string): ParseResult {
    const rawStatements: Phrase[] = splitCodeIntoRawStatements(code);
    console.log(rawStatements);

    throw 'incomplete';
}

function splitCodeIntoRawStatements(code: string): Phrase[] {
    const statements: Phrase[] = [];
    let indexOfCurrentStatement: number = 0;
    let textOfCurrentStatement: string = '';
    let isCurrentlyInString: boolean = false;

    //loop over every character
    for (let i: number = 0; i < code.length; i++) {
        let character: string = code[i];

        let rawStatementType: PhraseTypes;

        function closeStatement(shouldCleanString: boolean): void {
            if (rawStatementType == undefined) {
                throw ERR_NO_STATEMENT_TYPE(i);
            }

            if (shouldCleanString == true) {
                textOfCurrentStatement = removeOuterSpacesFromString(textOfCurrentStatement);
            }

            if (textOfCurrentStatement == '') {
                //do not add empty statements
                clearStatement(false);
                return;
            }

            const newStatement: Phrase = {
                rawText: textOfCurrentStatement,
                type: rawStatementType,
            }
            statements[indexOfCurrentStatement] = newStatement;

            clearStatement(true);
        }

        function clearStatement(shouldIncreaseIndex: boolean) {
            if (shouldIncreaseIndex) indexOfCurrentStatement++;
            textOfCurrentStatement = '';
        }
        if (character == '"' || character == '\'') {
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
                clearStatement(false);
                continue;
            }

            closeStatement(false);
        } else if (isCurrentlyInString == true) {
            textOfCurrentStatement += character;
        } else if (character == '.' || character == ':') {
            switch (character) {
                case '.': {
                    rawStatementType = 'closed';
                    break;
                }
                case ':': {
                    rawStatementType = 'opening';
                    break;
                }
            }

            closeStatement(true);
        } else if (character == ',') {
            rawStatementType = 'continuous';
            closeStatement(true);
        } else if (character == ';') {
            rawStatementType = 'separating';
            closeStatement(true);
        } else if (character == '=') {
            rawStatementType = 'assignment-start';
            closeStatement(true);
        } else {
            if (character == '\n') {
                //do not preserve newlines
                character = ' ';
            }

            // check if character should be added to statement text
            const leadingCharacter: string | undefined = code[i - 1];
            const characterIsSpace: boolean = checkIfCharacterIsSpace(character);
            const leadingCharacterIsSpace: boolean = leadingCharacter != undefined && checkIfCharacterIsSpace(leadingCharacter);
            const characterShouldBeIgnoredUnlessInString: boolean = characterIsSpace == true && leadingCharacterIsSpace == true;

            if (characterShouldBeIgnoredUnlessInString) continue;
            textOfCurrentStatement += character;
        }
    }

    return statements;
}