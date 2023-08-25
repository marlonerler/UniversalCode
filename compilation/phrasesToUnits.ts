#!/usr/bin/env node

import { ERROR_NO_PHRASE_RECOGNITION } from '../constants/errors';
import {
    MultiwordPhraseParts,
    Phrase,
    PhraseType,
    ScopeType,
    Unit,
} from '../types/parser';
import {
    getPartsOfPMultiwordPhrase,
    getValueOfBooleanString,
} from '../utility/parser';

// DATA
let units: Unit[];

// current unit
let indexOfCurrentUnit: number;
let currentUnit: Unit | undefined;

// track scopes of code
let scopes: ScopeType[];

// track loop
let indexOfCurrentPhrase: number = 0;
let phrase: Phrase | undefined;
let phraseType: PhraseType | undefined;
let phraseCharacters: string[] = [];

// MAIN
export function getUnitsFromPhrases(phrases: Phrase[]): Unit[] {
    units = [];

    // current unit
    indexOfCurrentUnit = 0;
    currentUnit = undefined;

    // first level is same grammar as function body
    scopes = ['function-body'];

    for (
        indexOfCurrentPhrase = 0;
        indexOfCurrentPhrase < phrases.length;
        indexOfCurrentPhrase++
    ) {
        phrase = phrases[indexOfCurrentPhrase];
        phraseType = phrase.type;
        phraseCharacters = phrase.rawTextCharacters;

        let couldClassifyPhrase: boolean = false;
        const parseProcedure: phraseRecognitionFunction[] = [
            recognizeComment,

            recognizeBoolean,
            recognizeFalsyValues,
            recognizeIntegerOrFloat,
            recognizeString,

            recognizeMultiwordPhraseUnit,
        ];
        for (let j = 0; j < parseProcedure.length; j++) {
            const functionToRun: phraseRecognitionFunction = parseProcedure[j];
            couldClassifyPhrase = functionToRun();
            if (couldClassifyPhrase == true) break;
        }
        if (couldClassifyPhrase == false) {
            throw ERROR_NO_PHRASE_RECOGNITION(indexOfCurrentPhrase);
        }
    }

    return units;
}

// HELPERS
// general
function getCurrentScopeType(): ScopeType {
    return scopes[scopes.length - 1];
}

function closeCurrentUnit(): void {
    if (currentUnit == undefined) {
        throw ERROR_NO_PHRASE_RECOGNITION(indexOfCurrentPhrase);
    }

    units.push(currentUnit);
    currentUnit = undefined;
}

// recognition
type phraseRecognitionFunction = () => boolean;

function recognizeBoolean(): boolean {
    if (phraseType != 'closing') return false;

    const phraseText: string = phraseCharacters.join('');
    if (phraseText != 'true' && phraseText != 'false') return false;
    const booleanValue: 0 | 1 = getValueOfBooleanString(phraseText);

    currentUnit = {
        type: 'boolean',
        value: booleanValue,
    };
    closeCurrentUnit();

    return true;
}

function recognizeFalsyValues(): boolean {
    if (phraseType != 'closing') return false;

    const phraseText: string = phraseCharacters.join('');
    if (
        phraseText != 'undefined' &&
        phraseText != 'null' &&
        phraseText != 'NaN'
    )
        return false;

    currentUnit = {
        type: phraseText,
    };
    closeCurrentUnit();

    return true;
}

function recognizeMultiwordPhraseUnit(): boolean {
    if (phraseType != 'closing') return false;

    const phraseParts: MultiwordPhraseParts =
        getPartsOfPMultiwordPhrase(phraseCharacters);
    const headString: string = phraseParts.head.join('');

    if (
        headString != 'import' &&
        headString != 'language' &&
        headString != 'module' &&
        headString != 'section'
    )
        return false;

    if (headString == 'import') {
        currentUnit = {
            type: 'import',
            sourceName: phraseParts.body.join(''),
        };
    } else if (headString == 'language') {
        currentUnit = {
            type: 'language-definition',
            targetLanguage: phraseParts.body.join(''),
        };
    } else if (headString == 'module') {
        currentUnit = {
            type: 'module-name-definition',
            moduleName: phraseParts.body.join(''),
        };
    } else if (headString == 'section') {
        currentUnit = {
            type: 'section-marker',
            sectionName: phraseParts.body.join(''),
        };
    }

    closeCurrentUnit();

    return true;
}

function recognizeIntegerOrFloat(): boolean {
    if (phraseType != 'closing') return false;

    const phraseText: string = phraseCharacters.join('');
    const parsedNumber: number = parseFloat(phraseText);

    if (isNaN(parsedNumber) == true) return false;

    let unitType: 'float' | 'integer' = 'float';
    if (Number.isInteger(parsedNumber)) {
        unitType = 'integer';
    }

    currentUnit = {
        type: unitType,
        value: parsedNumber,
    };
    closeCurrentUnit();

    return true;
}

function recognizeComment(): boolean {
    if (phraseType != 'comment') return false;

    currentUnit = {
        type: 'comment',
        content: phraseCharacters.join(''),
    };
    closeCurrentUnit();

    return true;
}

function recognizeString(): boolean {
    if (phraseType != 'safe-string' && phraseType != 'normal-string')
        return false;

    currentUnit = {
        type: phraseType,
        content: phraseCharacters.join(''),
    };
    closeCurrentUnit();

    return true;
}
