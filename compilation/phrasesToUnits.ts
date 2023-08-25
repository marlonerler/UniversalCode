#!/usr/bin/env node

import { ERROR_NO_PHRASE_RECOGNITION } from '../constants/errors';
import {
    HeadAndBody,
    Phrase,
    PhraseType,
    ScopeType,
    ScopesWithFunctionGrammar,
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

            recognizeCommandHead,
            recognizeCommands,

            recognizeEndMarkers,
            recognizeGenericUnit,
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
function closeCurrentUnit(): void {
    if (currentUnit == undefined) {
        throw ERROR_NO_PHRASE_RECOGNITION(indexOfCurrentPhrase);
    }

    units.push(currentUnit);
    currentUnit = undefined;
}

function checkIfScopeUsesFunctionGrammar(): boolean {
    const scope: ScopeType = getCurrentScopeType();
    return ScopesWithFunctionGrammar.indexOf(scope) > -1;
}

function getCurrentScopeType(): ScopeType {
    return scopes[scopes.length - 1];
}

// values
function processUnitWithValueForAssignment(draftedUnit: Unit): void {
    if (
        currentUnit == undefined ||
        (currentUnit.type != 'assignment' &&
            currentUnit.type != 'variable-declatation')
    )
        return;

    currentUnit.value = draftedUnit;
    closeCurrentUnit();
}

function processGenericUnitForCommand(): boolean {
    if (currentUnit == undefined) return false;

    const phraseText: string = phraseCharacters.join('');

    switch (currentUnit.type) {
        case 'rename-command': {
            currentUnit.oldName = phraseText;
            closeCurrentUnit();
            return true;
        }
    }

    return false;
}

// assignments
function processAssignmentForFunctionBody(): boolean {
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

function processAssignmentForCommandBody(): boolean {
    if (currentUnit == undefined) return false;

    const phraseText: string = phraseCharacters.join('');

    switch (currentUnit.type) {
        case 'rename-command': {
            currentUnit.newName = phraseText;
            break;
        }
    }

    return true;
}

// recognition
type phraseRecognitionFunction = () => boolean;

function recognizeAssignment(): boolean {
    if (phraseType != 'assignment-key') return false;

    if (getCurrentScopeType() == 'function-body') {
        return processAssignmentForFunctionBody();
    } else if (getCurrentScopeType() == 'command-body') {
        return processAssignmentForCommandBody();
    }

    return false;
}

function recognizeBoolean(): boolean {
    if (checkIfScopeUsesFunctionGrammar() == false) return false;
    if (phraseType != 'closing') return false;

    const phraseText: string = phraseCharacters.join('');
    if (phraseText != 'true' && phraseText != 'false') return false;
    const booleanValue: 0 | 1 = getValueOfBooleanString(phraseText);

    let draftedUnit: Unit = {
        type: 'boolean',
        value: booleanValue,
    };
    processUnitWithValueForAssignment(draftedUnit);

    return true;
}

function recognizeCommandHead(): boolean {
    if (checkIfScopeUsesFunctionGrammar() == false) return false;
    if (phraseType != 'opening') return false;

    const phraseText = phraseCharacters.join('');
    if (phraseText != 'command') return false;

    currentUnit = {
        type: 'command-head',
    };
    closeCurrentUnit();

    scopes.push('command-body');
    return true;
}

function recognizeCommands(): boolean {
    if (getCurrentScopeType() != 'command-body') return false;
    if (phraseType != 'opening') return false;

    const phraseText: string = phraseCharacters.join('');

    switch (phraseText) {
        case 'rename': {
            currentUnit = {
                type: 'rename-command',
                oldName: undefined,
                newName: undefined,
            };
        }
    }

    return true;
}

function recognizeComment(): boolean {
    if (checkIfScopeUsesFunctionGrammar() == false) return false;
    if (phraseType != 'comment') return false;

    currentUnit = {
        type: 'comment',
        content: phraseCharacters.join(''),
    };
    closeCurrentUnit();

    return true;
}

function recognizeEndMarkers(): boolean {
    const phraseParts: HeadAndBody = getHeadAndBody(phraseCharacters);
    const headString: string = phraseParts.head.join('');

    if (headString != 'end') return false;

    const bodyText: string = phraseParts.body.join('');

    const endingScopes: { [key: string]: ScopeType } = {
        case: 'case-body',
        cmd: 'command-body',
        fn: 'function-body',
        for: 'for-loop-body',
        if: 'if-block-body',
        ifc: 'interface-body',
        switch: 'switch-body',
        while: 'while-loop-body',
    };

    const endingScope: ScopeType | undefined = endingScopes[bodyText];
    if (endingScope == undefined) return false;

    currentUnit = {
        type: 'end-marker',
        endingScope,
    };
    closeCurrentUnit();

    return true;
}

function recognizeFalsyValues(): boolean {
    if (checkIfScopeUsesFunctionGrammar() == false) return false;
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
    processUnitWithValueForAssignment(draftedUnit);

    return true;
}

function recognizeIntegerOrFloat(): boolean {
    if (checkIfScopeUsesFunctionGrammar() == false) return false;
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
    processUnitWithValueForAssignment(draftedUnit);

    return true;
}

function recognizeMultiwordPhraseUnit(): boolean {
    if (checkIfScopeUsesFunctionGrammar() == false) return false;
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
    if (checkIfScopeUsesFunctionGrammar() == false) return false;
    if (phraseType != 'safe-string' && phraseType != 'normal-string')
        return false;

    const draftedUnit: Unit = {
        type: phraseType,
        content: phraseCharacters.join(''),
    };
    processUnitWithValueForAssignment(draftedUnit);

    return true;
}

function recognizeVariableDeclaration(): boolean {
    if (checkIfScopeUsesFunctionGrammar() == false) return false;
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

function recognizeGenericUnit(): boolean {
    if (getCurrentScopeType() == 'command-body') {
        return processGenericUnitForCommand();
    }

    return false;
}
