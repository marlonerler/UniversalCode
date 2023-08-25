#!/usr/bin/env node

import { ERROR_NO_PHRASE_RECOGNITION } from "../constants/errors";
import { Phrase, PhraseType, ScopeType, Unit } from "../types/parser";
import {  } from "../utility/statements";

// DATA
let units: Unit[];

// current unit
let indexOfCurrentUnit: number;
let currentUnit: Unit | undefined;

// track scopes of code
let scopes: ScopeType[];

// MAIN
export function getUnitsFromPhrases(phrases: Phrase[]): Unit[] {
    units = [];

    // current unit
    indexOfCurrentUnit = 0;
    currentUnit = undefined;

    // first level is same grammar as function body
    scopes = ['function-body'];

    for (let i: number = 0; i < phrases.length; i++) {
        const phrase: Phrase = phrases[i];
        console.log(phrase);
        const type: PhraseType = phrase.type;
        const rawTextCharacters: string[] = phrase.rawTextCharacters;

        let couldClassifyPhrase: boolean = false;
        const parseProcedure: phraseRecognitionFunction[] = [
            recognizeComment,
        ]
        for (let j = 0; j < parseProcedure.length; j++) {
            const functionToRun: phraseRecognitionFunction = parseProcedure[j];
            couldClassifyPhrase = functionToRun(i, type, rawTextCharacters);
            if (couldClassifyPhrase == true) break;
        }
        if (couldClassifyPhrase == false) {
            throw ERROR_NO_PHRASE_RECOGNITION(i);
        }
    }

    return units;
}

// HELPERS
// general
function getCurrentScopeType(): ScopeType {
    return scopes[scopes.length - 1];
}

function closeCurrentUnit(indexOfCurrentPhrase: number): void {
    if (currentUnit == undefined) {
        throw ERROR_NO_PHRASE_RECOGNITION(indexOfCurrentPhrase);
    }
}

// recognition
type phraseRecognitionFunction = (indexOfCurrentPhrase: number, phraseType: PhraseType, characters: string[]) => boolean;

function recognizeComment(indexOfCurrentPhrase: number, phraseType: PhraseType, characters: string[]): boolean {
    if (phraseType != 'comment') return false;

    currentUnit = {
        type: 'comment',
        comment: characters.join(''),
    }

    closeCurrentUnit(indexOfCurrentPhrase)

    return true;
}