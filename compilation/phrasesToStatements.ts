#!/usr/bin/env node

import { ERROR_NO_PHRASE_RECOGNITION, ERROR_NO_STATEMENT_TYPE } from "../constants/errors";
import { IntroducingStatementParts, Phrase, PhraseType, ScopeType, Statement, StatementType } from "../types/parser";
import { getPartsOfIntroducingStatement } from "../utility/statements";

// DATA
let statements: Statement[];

// current statement
let indexOfCurrentStatement: number;
let currentStatementData: string[];
let currentStatementType: StatementType | undefined;

// track scopes of code
let scopes: ScopeType[];

// MAIN
export function getStatementsFromPhrases(phrases: Phrase[]): Statement[] {
    statements = [];

    // current statement
    indexOfCurrentStatement = 0;
    currentStatementData = [];
    currentStatementType = undefined;

    // first level is same grammar as function body
    scopes = ['function-body'];

    for (let i: number = 0; i < phrases.length; i++) {
        const phrase: Phrase = phrases[i];
        const type: PhraseType = phrase.type;
        const rawTextCharacters: string[] = phrase.rawTextCharacters;

        let couldClassifyPhrase: boolean = false;
        const parseProcedure: phraseRecognitionFunction[] = [
            recognizeComment,
        ]
        for (let j = 0; j < parseProcedure.length; j++) {
            const functionToRun: phraseRecognitionFunction = parseProcedure[j];
            couldClassifyPhrase = functionToRun(type, rawTextCharacters);
            if (couldClassifyPhrase == true) break;
        }
        if (couldClassifyPhrase == false) {
            throw ERROR_NO_PHRASE_RECOGNITION(i);
        }
    }
}

// HELPERS
// general
function getCurrentScopeType(): ScopeType {
    return scopes[scopes.length - 1];
}

function closeCurrentStatement(indexOfCurrentPhrase: number): void {
    if (currentStatementType == undefined) {
        throw ERROR_NO_STATEMENT_TYPE(indexOfCurrentPhrase);
    }
}

// recognition
type phraseRecognitionFunction = (phraseType: PhraseType, characters: string[]) => boolean;

function recognizeComment(phraseType: PhraseType, characters: string[]): boolean {
    if (phrase.type != 'comment') return false;

    currentStatementType = 'comment';
    currentStatementData = characters;
}