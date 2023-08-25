#!/usr/bin/env node

import { ERROR_NO_PHRASE_RECOGNITION } from '../constants/errors';
import {
    HeadAndBody,
    LoopType,
    Phrase,
    PhraseType,
    ScopeType,
    scopesWithFunctionGrammar,
    Unit,
} from '../types/parser';
import { getHeadAndBody, getValueOfBooleanString } from '../utility/parser';

// DATA
let units: Unit[];

// units
let currentUnit: Unit | undefined;
let trailingUnit: Unit | undefined;

// track scopes of code
let scopes: ScopeType[];

// track loop
let indexOfCurrentPhrase: number = 0;
let currentPhrase: Phrase | undefined;
let currentPhraseType: PhraseType | undefined;
let currentPhraseCharacters: string[] = [];

// MAIN
export function getUnitsFromPhrases(phrases: Phrase[]): Unit[] {
    units = [];

    // first level is same grammar as function body
    scopes = ['function-body'];

    for (
        indexOfCurrentPhrase = 0;
        indexOfCurrentPhrase < phrases.length;
        indexOfCurrentPhrase++
    ) {
        // units
        currentUnit = undefined;
        trailingUnit = undefined;

        // phrases
        currentPhrase = phrases[indexOfCurrentPhrase];
        currentPhraseType = currentPhrase.type;
        currentPhraseCharacters = currentPhrase.rawTextCharacters;

        let didRecognizePhrase: boolean = false;
        const reognitionFunctions: PhraseRecognitionFunction[] = [
            recognizeComment,

            recognizeBoolean,
            recognizeFalsyValues,
            recognizeIntegerOrFloat,
            recognizeString,
            recognizeCompoundDataTypes,

            recognizeMultiwordPhraseUnit,

            recognizeVariableDeclaration,
            recognizeAssignment,

            recognizeCommandHead,
            recognizeCommands,

            recognizeFunctionDefinition,

            recognizeEndMarkers,
            recognizeTwoWordCluster,

            catchOtherPhrases,
        ];
        for (let j = 0; j < reognitionFunctions.length; j++) {
            const functionToRun: PhraseRecognitionFunction = reognitionFunctions[j];
            didRecognizePhrase = functionToRun();
            if (didRecognizePhrase == true) break;
        }
        if (didRecognizePhrase == false) {
            currentUnit = {
                type: 'unknown',
                text: currentPhraseCharacters.join(''),
            };
        }
        if (currentUnit != undefined) {
            units.push(currentUnit);
        }
        if (trailingUnit != undefined) {
            units.push(trailingUnit);
        }
    }

    return units;
}

// HELPERS
// general
function checkIfScopeUsesFunctionGrammar(): boolean {
    const scope: ScopeType = getCurrentScopeType();
    return scopesWithFunctionGrammar.indexOf(scope) > -1;
}

function getCurrentScopeType(): ScopeType {
    return scopes[scopes.length - 1];
}

// multiword
function processClosingMultiwordUnit(
    phraseParts: HeadAndBody,
    headString: string,
    bodyString: string,
): boolean {
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
        default: {
            return false;
        }
    }

    return true;
}

function processEnumeratingMultiwordUnit(
    phraseParts: HeadAndBody,
    headString: string,
    bodyString: string,
): boolean {
    switch (headString) {
        case 'count':
        case 'each':
        case 'until': {
            let loopTypes: { [key: string]: LoopType } = {
                count: 'index',
                each: 'item',
                until: 'count',
            };
            const loopType: LoopType | undefined = loopTypes[headString];
            if (loopType == undefined) return false;

            currentUnit = {
                type: 'item-loop-head',
                loopType,
                iterableName: bodyString,
            };
            break;
        }
        default: {
            return false;
        }
    }

    return true;
}

function processOpeningMultiwordUnit(
    phraseParts: HeadAndBody,
    headString: string,
    bodyString: string,
): boolean {
    switch (headString) {
        case 'function': {
            currentUnit = {
                type: 'function-head',
                name: bodyString,
            };
            break;
        }
        case 'interface': {
            currentUnit = {
                type: 'interface-head',
                name: bodyString,
            };

            scopes.push('interface-body');
            break;
        }
        case 'if':
        case 'elif': {
            let type: 'if-head' | 'elif-head' | undefined = undefined;
            if (headString == 'if') {
                type = 'if-head';
            } else if (headString == 'elif') {
                type = 'elif-head';

                //elif closes previous if scope
                scopes.pop();
            }

            if (type == undefined) return false;

            currentUnit = {
                type,
                condition: bodyString,
            };

            scopes.push('if-block-body');
            break;
        }
        case 'else': {
            currentUnit = {
                type: 'else-head',
            };

            break;
        }
        case 'return': {
            currentUnit = {
                type: 'return-statement',
            };
            break;
        }
        case 'returns': {
            currentUnit = {
                type: 'function-return-type-annotation',
                returnType: bodyString,
            };

            scopes.push('function-body');
            break;
        }
        case 'take': {
            currentUnit = {
                type: 'loop-iterator-name-definition',
                value: bodyString,
            };

            scopes.push('loop-body');
            break;
        }
        case 'type': {
            currentUnit = {
                type: 'type-definition',
                name: bodyString,
                typeReferences: [],
            };

            break;
        }
        case 'while': {
            currentUnit = {
                type: 'while-loop-head',
                condition: bodyString,
            };

            scopes.push('loop-body');
            break;
        }
        default: {
            return false;
        }
    }

    return true;
}

// recognition
type PhraseRecognitionFunction = () => boolean;

function recognizeAssignment(): boolean {
    if (currentPhraseType != 'assignment-key') return false;

    const phraseText: string = currentPhraseCharacters.join('');

    currentUnit = {
        type: 'assignment',
        key: phraseText,
    };

    return true;
}

function recognizeBoolean(): boolean {
    if (currentPhraseType != 'closing') return false;

    const phraseText: string = currentPhraseCharacters.join('');
    if (phraseText != 'true' && phraseText != 'false') return false;
    const booleanValue: 0 | 1 = getValueOfBooleanString(phraseText);

    currentUnit = {
        type: 'boolean',
        value: booleanValue,
    };

    return true;
}

function recognizeCommandHead(): boolean {
    if (checkIfScopeUsesFunctionGrammar() == false) return false;
    if (currentPhraseType != 'opening') return false;

    const phraseText = currentPhraseCharacters.join('');
    if (phraseText != 'command') return false;

    currentUnit = {
        type: 'command-head',
    };

    scopes.push('command-body');
    return true;
}

function recognizeCommands(): boolean {
    if (getCurrentScopeType() != 'command-body') return false;
    if (currentPhraseType != 'opening') return false;

    const phraseText: string = currentPhraseCharacters.join('');

    currentUnit = {
        type: 'command',
        commandName: phraseText,
    };

    return true;
}

function recognizeComment(): boolean {
    if (checkIfScopeUsesFunctionGrammar() == false) return false;
    if (currentPhraseType != 'comment') return false;

    currentUnit = {
        type: 'comment',
        content: currentPhraseCharacters.join(''),
    };

    return true;
}

function recognizeCompoundDataTypes(): boolean {
    if (currentPhraseType != 'opening') return false;

    const phraseText: string = currentPhraseCharacters.join('');

    switch (phraseText) {
        case 'array': {
            currentUnit = {
                type: 'array-start',
            };

            scopes.push('array-body');
            return true;
        }
        case 'object': {
            currentUnit = {
                type: 'object-start',
            };

            scopes.push('object-body');
            return true;
        }
        default: {
            return false;
        }
    }
}

function recognizeEndMarkers(): boolean {
    const phraseParts: HeadAndBody = getHeadAndBody(currentPhraseCharacters);
    const headString: string = phraseParts.head.join('');

    if (headString != 'end') return false;

    const bodyText: string = phraseParts.body.join('');

    const endingScopes: { [key: string]: ScopeType } = {
        case: 'case-body',
        cmd: 'command-body',
        fn: 'function-body',
        loop: 'loop-body',
        if: 'if-block-body',
        ifc: 'interface-body',
        switch: 'switch-body',
    };

    const endingScope: ScopeType | undefined = endingScopes[bodyText];
    if (endingScope == undefined) return false;

    currentUnit = {
        type: 'end-marker',
        endingScope,
    };

    scopes.pop();

    return true;
}

function recognizeFalsyValues(): boolean {
    if (currentPhraseType != 'closing') return false;

    const phraseText: string = currentPhraseCharacters.join('');
    if (
        phraseText != 'undefined' &&
        phraseText != 'null' &&
        phraseText != 'NaN' &&
        phraseText != 'void'
    )
        return false;

    currentUnit = {
        type: phraseText,
    };

    return true;
}

function recognizeIntegerOrFloat(): boolean {
    if (currentPhraseType != 'closing') return false;

    const phraseText: string = currentPhraseCharacters.join('');
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

    return true;
}

function recognizeFunctionDefinition(): boolean {
    if (checkIfScopeUsesFunctionGrammar() == false) return false;
    if (currentPhraseType != 'opening') return false;

    const phraseParts: HeadAndBody = getHeadAndBody(currentPhraseCharacters);
    const headString: string = phraseParts.head.join('');
    const bodyString: string = phraseParts.body.join('');

    if (headString != 'function') return false;

    currentUnit = {
        type: 'function-head',
        name: bodyString,
    };

    return true;
}

function recognizeMultiwordPhraseUnit(): boolean {
    const phraseParts: HeadAndBody = getHeadAndBody(currentPhraseCharacters);
    const headString: string = phraseParts.head.join('');
    const bodyString = phraseParts.body.join('');

    if (currentPhraseType == 'closing') {
        return processClosingMultiwordUnit(phraseParts, headString, bodyString);
    } else if (currentPhraseType == 'opening') {
        return processOpeningMultiwordUnit(phraseParts, headString, bodyString);
    } else if (currentPhraseType == 'enumerating') {
        return processEnumeratingMultiwordUnit(
            phraseParts,
            headString,
            bodyString,
        );
    }

    return false;
}

function recognizeString(): boolean {
    if (checkIfScopeUsesFunctionGrammar() == false) return false;
    if (currentPhraseType != 'safe-string' && currentPhraseType != 'normal-string')
        return false;

    currentUnit = {
        type: currentPhraseType,
        content: currentPhraseCharacters.join(''),
    };

    return true;
}

function recognizeTwoWordCluster(): boolean {
    const phraseParts: HeadAndBody = getHeadAndBody(currentPhraseCharacters);
    if (phraseParts.body.length == 0) return false;

    const headString: string = phraseParts.head.join('');

    // body must contain no space
    for (let i: number = 0; i < phraseParts.body.length; i++) {
        if (phraseParts.body[i] == ' ') return false;
    }

    const bodyString = phraseParts.body.join('');

    currentUnit = {
        type: 'two-word-cluster',
        first: headString,
        second: bodyString,
    };

    return true;
}

function recognizeVariableDeclaration(): boolean {
    if (checkIfScopeUsesFunctionGrammar() == false) return false;
    if (currentPhraseType != 'opening') return false;

    const phraseParts: HeadAndBody = getHeadAndBody(currentPhraseCharacters);
    const headString: string = phraseParts.head.join('');

    if (headString != 'constant' && headString != 'mutable') return false;

    const dataType: string = phraseParts.body.join('');

    currentUnit = {
        type: 'variable-declatarion',
        isMutable: headString == 'mutable',
        dataType,
    };

    return true;
}

function catchOtherPhrases(): boolean {
    if (currentPhraseType == 'closing') {
        switch (getCurrentScopeType()) {
            case 'array-body': {
                scopes.pop();

                trailingUnit = {
                    type: 'array-end',
                };
                break;
            }
            case 'object-body': {
                scopes.pop();

                trailingUnit = {
                    type: 'object-end',
                };
                break;
            }
        }
    }

    return false;
}
