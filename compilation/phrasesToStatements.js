#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatementsFromPhrases = void 0;
function getStatementsFromPhrases(phrases) {
    const statements = [];
    // current statement
    let indexOfCurrentStatement = 0;
    let currentStatementData = [];
    let currentStatementType = '';
    // track scopes of code
    // first level is same grammar as function body
    let scopes = ['function-body'];
    function getCurrentScopeType() {
        return scopes[scopes.length - 1];
    }
    for (let i = 0; i < phrases.length; i++) {
        const phrase = phrases[i];
        const type = phrase.type;
        const rawTextCharacters = phrase.rawTextCharacters;
    }
}
exports.getStatementsFromPhrases = getStatementsFromPhrases;
