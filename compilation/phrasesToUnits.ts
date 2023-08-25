#!/usr/bin/env node

import { ERROR_NO_PHRASE_RECOGNITION } from '../constants/errors';
import {
    HeadAndBody,
    LoopType,
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
            recognizeCompoundDataTypes,

            recognizeMultiwordPhraseUnit,

            recognizeVariableDeclaration,
            recognizeAssignment,

            recognizeCommandHead,
            recognizeCommands,

            recognizeFunctionDefinition,

            recognizeEndMarkers,
            recognizeGenericUnit,
        ];
        for (let j = 0; j < parseProcedure.length; j++) {
            const functionToRun: phraseRecognitionFunction = parseProcedure[j];
            couldClassifyPhrase = functionToRun();
            if (couldClassifyPhrase == true) break;
        }
        if (couldClassifyPhrase == false) {
            const fallbackUnit: Unit = {
                type: 'unknown',
                text: phraseCharacters.join(''),
            };
            processUnitWithValueForAssignment(fallbackUnit);
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

// generic
function processAddingGenericUnit(): boolean {
    if (currentUnit == undefined) return false;

    const phraseText: string = phraseCharacters.join('');

    switch (currentUnit.type) {
        case 'object-property': {
            currentUnit.value = phraseText;
            closeCurrentUnit();

            if (phraseType == 'closing') {
                scopes.pop();
            }
            return true;
        }
        case 'function-head': {
            // function parameter
            const phraseParts: HeadAndBody = getHeadAndBody(phraseCharacters);
            const parameter: Extract<Unit, { type: 'function-parameter' }> = {
                type: 'function-parameter',
                dataType: phraseParts.head.join(''),
                name: phraseParts.body.join(''),
            };
            currentUnit.parameters.push(parameter);
            return true;
        }
        case 'type-definition': {
            currentUnit.typeReferences.push(phraseText);
            if (phraseType == 'closing') {
                closeCurrentUnit();
            }
            return true;
        }
    }

    return false;
}

function processNewGenericUnit(): boolean {
    const phraseText: string = phraseCharacters.join('');

    switch (getCurrentScopeType()) {
        case 'array-body': {
            currentUnit = {
                type: 'array-item',
                value: phraseText,
            };
            closeCurrentUnit();

            if (phraseType == 'closing') {
                scopes.pop();
            }
            return true;
        }
    }

    return false;
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
        case 'return': {
            currentUnit = {
                type: 'return-statement',
                value: phraseParts.body.join(''),
            };
            break;
        }
        default: {
            return false;
        }
    }

    closeCurrentUnit();
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
                itemName: undefined,
            };
            break;
        }
        default: {
            if (getCurrentScopeType() != 'interface-body') return false;

            currentUnit = {
                type: 'interface-property',
                name: bodyString,
                dataType: headString,
            };
            closeCurrentUnit();
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
                returnType: undefined,
                name: bodyString,
                parameters: [],
            };
            break;
        }
        case 'interface': {
            currentUnit = {
                type: 'interface-head',
                name: bodyString,
            };
            closeCurrentUnit();
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
            closeCurrentUnit();
            scopes.push('if-block-body');
            break;
        }
        case 'else': {
            currentUnit = {
                type: 'else-head',
            };
            closeCurrentUnit();
            break;
        }
        case 'returns': {
            if (currentUnit == undefined || currentUnit.type != 'function-head')
                return false;

            currentUnit.returnType = bodyString;
            closeCurrentUnit();
            scopes.push('function-body');
            break;
        }
        case 'take': {
            if (
                currentUnit == undefined ||
                currentUnit.type != 'item-loop-head'
            )
                return false;

            currentUnit.itemName = bodyString;
            closeCurrentUnit();
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
            closeCurrentUnit();
            scopes.push('loop-body');
            break;
        }
        default: {
            return false;
        }
    }

    return true;
}

// values
function processUnitWithValueForAssignment(draftedUnit: Unit): void {
    if (
        currentUnit == undefined ||
        (currentUnit.type != 'assignment' &&
            currentUnit.type != 'variable-declatarion')
    ) {
        currentUnit = draftedUnit;
    } else {
        currentUnit.value = draftedUnit;
    }

    closeCurrentUnit();
}

// assignments
function processAssignmentForFunctionBody(): boolean {
    const phraseText: string = phraseCharacters.join('');

    if (
        currentUnit != undefined &&
        currentUnit.type == 'variable-declatarion'
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

function processAssignmentForObjectBody(): boolean {
    const phraseText: string = phraseCharacters.join('');

    currentUnit = {
        type: 'object-property',
        key: phraseText,
        value: undefined,
    };

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
    } else if (getCurrentScopeType() == 'object-body') {
        return processAssignmentForObjectBody();
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

function recognizeCompoundDataTypes(): boolean {
    if (checkIfScopeUsesFunctionGrammar() == false) return false;
    if (phraseType != 'opening') return false;

    const phraseText: string = phraseCharacters.join('');

    switch (phraseText) {
        case 'array': {
            scopes.push('array-body');
            return true;
        }
        case 'object': {
            scopes.push('object-body');
            return true;
        }
        default: {
            return false;
        }
    }
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
    closeCurrentUnit();
    scopes.pop();

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

function recognizeFunctionDefinition(): boolean {
    if (checkIfScopeUsesFunctionGrammar() == false) return false;
    if (phraseType != 'opening') return false;

    const phraseParts: HeadAndBody = getHeadAndBody(phraseCharacters);
    const headString: string = phraseParts.head.join('');

    if (headString != 'function') return false;

    return true;
}

function recognizeMultiwordPhraseUnit(): boolean {
    const phraseParts: HeadAndBody = getHeadAndBody(phraseCharacters);
    const headString: string = phraseParts.head.join('');
    const bodyString = phraseParts.body.join('');

    if (phraseType == 'closing') {
        return processClosingMultiwordUnit(phraseParts, headString, bodyString);
    } else if (phraseType == 'opening') {
        return processOpeningMultiwordUnit(phraseParts, headString, bodyString);
    } else if (phraseType == 'enumerating') {
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
        type: 'variable-declatarion',
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
    } else if (currentUnit == undefined) {
        return processNewGenericUnit();
    } else {
        return processAddingGenericUnit();
    }
}
