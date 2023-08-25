#!/usr/bin/env node

import { ERROR_NO_PHRASE_RECOGNITION } from '../constants/errors';
import { MultiwordPhraseParts, Phrase, PhraseType, ScopeType, Unit } from '../types/parser';
import { getPartsOfPMultiwordPhrase, getValueOfBooleanString } from '../utility/parser';

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
        const type: PhraseType = phrase.type;
        const rawTextCharacters: string[] = phrase.rawTextCharacters;

        let couldClassifyPhrase: boolean = false;
        const parseProcedure: phraseRecognitionFunction[] = [
            recognizeComment,

            recognizeBoolean,
            recognizeFalsyValues,
            recognizeIntegerOrFloat,
            recognizeString,

            recognizeImport,
        ];
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

    units.push(currentUnit);
    currentUnit = undefined;
}

// recognition
type phraseRecognitionFunction = (
    indexOfCurrentPhrase: number,
    phraseType: PhraseType,
    characters: string[],
) => boolean;

function recognizeBoolean(
    indexOfCurrentPhrase: number,
    phraseType: PhraseType,
    characters: string[],
): boolean {
    if (phraseType != 'closing') return false;

    const phraseText: string = characters.join('');
    if (phraseText != 'true' && phraseText != 'false') return false;
    const booleanValue: 0 | 1 = getValueOfBooleanString(phraseText);

    currentUnit = {
        type: 'boolean',
        value: booleanValue,
    };
    closeCurrentUnit(indexOfCurrentPhrase);

    return true;
}

function recognizeFalsyValues(
    indexOfCurrentPhrase: number,
    phraseType: PhraseType,
    characters: string[],
): boolean {
    if (phraseType != 'closing') return false;

    const phraseText: string = characters.join('');
    if (
        phraseText != 'undefined' &&
        phraseText != 'null' &&
        phraseText != 'NaN'
    )
        return false;

    currentUnit = {
        type: phraseText,
    };
    closeCurrentUnit(indexOfCurrentPhrase);

    return true;
}

function recognizeImport(
    indexOfCurrentPhrase: number,
    phraseType: PhraseType,
    characters: string[],
): boolean {
    if (phraseType != 'closing') return false;

    const phraseParts: MultiwordPhraseParts = getPartsOfPMultiwordPhrase(characters);
    const headString: string = phraseParts.head.join('');

    console.log(phraseParts);
    if (headString != 'import') return false;

    currentUnit = {
        type: 'import',
        sourceName: phraseParts.body.join(''),
    }
    closeCurrentUnit(indexOfCurrentPhrase);

    return true;
}

function recognizeIntegerOrFloat(
    indexOfCurrentPhrase: number,
    phraseType: PhraseType,
    characters: string[],
): boolean {
    if (phraseType != 'closing') return false;

    const phraseText: string = characters.join('');
    const parsedNumber: number = parseFloat(phraseText);
    console.log(phraseText, parsedNumber);
    if (isNaN(parsedNumber) == true) return false;

    let unitType: 'float' | 'integer' = 'float';
    if (Number.isInteger(parsedNumber)) {
        unitType = 'integer';
    }

    currentUnit = {
        type: unitType,
        value: parsedNumber,
    };
    closeCurrentUnit(indexOfCurrentPhrase);

    return true;
}

function recognizeComment(
    indexOfCurrentPhrase: number,
    phraseType: PhraseType,
    characters: string[],
): boolean {
    if (phraseType != 'comment') return false;

    currentUnit = {
        type: 'comment',
        content: characters.join(''),
    };
    closeCurrentUnit(indexOfCurrentPhrase);

    return true;
}

function recognizeString(
    indexOfCurrentPhrase: number,
    phraseType: PhraseType,
    characters: string[],
): boolean {
    if (phraseType != 'safe-string' && phraseType != 'normal-string')
        return false;

    currentUnit = {
        type: phraseType,
        content: characters.join(''),
    };
    closeCurrentUnit(indexOfCurrentPhrase);

    return true;
}
