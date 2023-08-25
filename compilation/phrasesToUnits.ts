#!/usr/bin/env node

import { ERROR_NO_PHRASE_RECOGNITION } from '../constants/errors';
import {
    HeadAndBody,
    Phrase,
    PhraseType,
    ScopeType,
    Unit,
} from '../types/parser';
import { getHeadAndBody, getValueOfBooleanString } from '../utility/parser';

// DATA
let units: Unit[];

// current unit
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

            recognizeVariableDeclaration,
            recognizeAssignment,
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

// values
function processUnitWithValue(draftedUnit: Unit): void {
    if (currentUnit == undefined) {
        currentUnit = draftedUnit;
        closeCurrentUnit();
        return;
    }

    if (
        currentUnit.type == 'assignment' ||
        currentUnit.type == 'variable-declatation'
    ) {
        currentUnit.value = draftedUnit;
        closeCurrentUnit();
    }
}

// recognition
type phraseRecognitionFunction = () => boolean;

function recognizeAssignment() {
    if (getCurrentScopeType() != 'function-body') return false;
    if (phraseType != 'assignment-key') return false;

    const phraseText: string = phraseCharacters.join('');

    if (
        currentUnit != undefined &&
        currentUnit.type == 'variable-declatation'
    ) {
        currentUnit.name = phraseText;
    } else {
        currentUnit = {
            type: 'assignment',
            key: phraseText,
            value: undefined,
        };
    }

    return true;
}

function recognizeBoolean(): boolean {
    if (getCurrentScopeType() != 'function-body') return false;
    if (phraseType != 'closing') return false;

    const phraseText: string = phraseCharacters.join('');
    if (phraseText != 'true' && phraseText != 'false') return false;
    const booleanValue: 0 | 1 = getValueOfBooleanString(phraseText);

    let draftedUnit: Unit = {
        type: 'boolean',
        value: booleanValue,
    };
    processUnitWithValue(draftedUnit);

    return true;
}

function recognizeComment(): boolean {
    if (getCurrentScopeType() != 'function-body') return false;
    if (phraseType != 'comment') return false;

    currentUnit = {
        type: 'comment',
        content: phraseCharacters.join(''),
    };
    closeCurrentUnit();

    return true;
}

function recognizeFalsyValues(): boolean {
    if (getCurrentScopeType() != 'function-body') return false;
    if (phraseType != 'closing') return false;

    const phraseText: string = phraseCharacters.join('');
    if (
        phraseText != 'undefined' &&
        phraseText != 'null' &&
        phraseText != 'NaN'
    )
        return false;

    const draftedUnit: Unit = {
        type: phraseText,
    };
    processUnitWithValue(draftedUnit);

    return true;
}

function recognizeIntegerOrFloat(): boolean {
    if (getCurrentScopeType() != 'function-body') return false;
    if (phraseType != 'closing') return false;

    const phraseText: string = phraseCharacters.join('');
    const parsedNumber: number = parseFloat(phraseText);

    if (isNaN(parsedNumber) == true) return false;

    let unitType: 'float' | 'integer' = 'float';
    if (Number.isInteger(parsedNumber)) {
        unitType = 'integer';
    }

    const draftedUnit: Unit = {
        type: unitType,
        value: parsedNumber,
    };
    processUnitWithValue(draftedUnit);

    return true;
}

function recognizeMultiwordPhraseUnit(): boolean {
    if (getCurrentScopeType() != 'function-body') return false;
    if (phraseType != 'closing') return false;

    const phraseParts: HeadAndBody = getHeadAndBody(phraseCharacters);
    const headString: string = phraseParts.head.join('');

    if (
        headString != 'import' &&
        headString != 'language' &&
        headString != 'module' &&
        headString != 'section'
    )
        return false;

    switch (headString) {
        case 'import': {
            currentUnit = {
                type: 'import',
                sourceName: phraseParts.body.join(''),
            };
            break;
        }
        case 'language': {
            currentUnit = {
                type: 'language-definition',
                targetLanguage: phraseParts.body.join(''),
            };
            break;
        }
        case 'module': {
            currentUnit = {
                type: 'module-name-definition',
                moduleName: phraseParts.body.join(''),
            };
            break;
        }
        case 'section': {
            currentUnit = {
                type: 'section-marker',
                sectionName: phraseParts.body.join(''),
            };
            break;
        }
    }

    closeCurrentUnit();
    return true;
}

function recognizeString(): boolean {
    if (getCurrentScopeType() != 'function-body') return false;
    if (phraseType != 'safe-string' && phraseType != 'normal-string')
        return false;

    const draftedUnit: Unit = {
        type: phraseType,
        content: phraseCharacters.join(''),
    };
    processUnitWithValue(draftedUnit);

    return true;
}

function recognizeVariableDeclaration(): boolean {
    if (getCurrentScopeType() != 'function-body') return false;
    if (phraseType != 'opening') return false;

    const phraseParts: HeadAndBody = getHeadAndBody(phraseCharacters);
    const headString: string = phraseParts.head.join('');

    if (headString != 'constant' && headString != 'mutable') return false;

    const dataType: string = phraseParts.body.join('');

    currentUnit = {
        type: 'variable-declatation',
        isMutable: headString == 'mutable',
        dataType,
        name: '',
        value: undefined,
    };

    return true;
}
