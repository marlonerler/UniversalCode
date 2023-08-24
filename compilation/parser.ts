#!/usr/bin/env node

// IMPORTS
import { ParseResult, RawStatement, StatementTypes } from "../types/parser";
import { checkIfCharacterIsSpace, removeOuterSpacesFromString } from "../utility/characters";

// MAIN
export function parseUnicCode(code: string): ParseResult {
    const rawStatements: RawStatement[] = splitCodeIntoRawStatements(code);
    console.log(rawStatements);

    throw 'incomplete';
}

function splitCodeIntoRawStatements(code: string): RawStatement[] {
    const statements: RawStatement[] = [];
    let indexOfCurrentStatement: number = 0;
    let textOfCurrentStatement: string = '';
    let isCurrentlyInString: boolean = false;

    //loop over every character
    for (let i: number = 0; i < code.length; i++) {
        let character: string = code[i];

        let rawStatementType: StatementTypes;

        function closeStatement(shouldCleanString: boolean): void {
            if (rawStatementType == undefined) {
                throw `Unknown error: could not determine type of statement (character at index ${i})`;
            }

            if (shouldCleanString == true) {
                textOfCurrentStatement = removeOuterSpacesFromString(textOfCurrentStatement);
            }

            const newStatement: RawStatement = {
                rawText: textOfCurrentStatement,
                type: rawStatementType,
            }
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
        } else if (character == '"' || character == '\'') {
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
        } else {
            if (character == '\n' && isCurrentlyInString == false) {
                //do not preserve newlines outside strings
                character = ' ';
            }

            // check if character should be added to statement text
            const leadingCharacter: string | undefined = code[i - 1];
            const characterIsSpace: boolean = checkIfCharacterIsSpace(character);
            const leadingCharacterIsSpace: boolean = leadingCharacter != undefined && checkIfCharacterIsSpace(leadingCharacter);
            const characterShouldBeIgnoredUnlessInString: boolean = characterIsSpace == true && leadingCharacterIsSpace == true;
            const characterIsTextOfStatement: boolean = !characterShouldBeIgnoredUnlessInString || isCurrentlyInString;

            if (characterIsTextOfStatement) {
                textOfCurrentStatement += character;
            }
        }
    }

    return statements;
}