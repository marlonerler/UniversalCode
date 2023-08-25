#!/usr/bin/env node

import { IntroducingStatementParts, Phrase, PhraseType, ScopeType, Statement } from "../types/parser";
import { getPartsOfIntroducingStatement } from "../utility/statements";

// DATA
let statements: Statement[];

// current statement
let indexOfCurrentStatement: number;
let currentStatementData: string[];
let currentStatementType: string;

// track scopes of code
let scopes: ScopeType[];

// MAIN
export function getStatementsFromPhrases(phrases: Phrase[]): Statement[] {
    statements = [];

    // current statement
    indexOfCurrentStatement = 0;
    currentStatementData = [];
    currentStatementType = '';

    // first level is same grammar as function body
    scopes = ['function-body'];

    for (let i: number = 0; i < phrases.length; i++) {
        const phrase: Phrase = phrases[i];
        const type: PhraseType = phrase.type;
        const rawTextCharacters: string[] = phrase.rawTextCharacters;
    }
}

// HELPERS
function getCurrentScopeType(): ScopeType {
    return scopes[scopes.length - 1];
}