#!/usr/bin/env node

import {
    HeadAndBody,
    LoopType,
    Sentence,
    SentenceType,
    ScopeType,
    scopesWithFunctionGrammar,
    Unit,
    calculationTypeArray,
    CalculationType,
} from '../types/parser';
import {
    getHeadAndBody,
    getValueOfBooleanString,
    verifyIsNumber,
} from '../utility/parser';

// DATA
let units: Unit[];

// units
let currentUnit: Unit | undefined;
let trailingUnit: Unit | undefined;

// track scopes of code
let scopes: ScopeType[];

// track loop
let indexOfCurrentSentence: number = 0;
let currentSentence: Sentence | undefined;
let currentSentenceType: SentenceType | undefined;
let currentSentenceCharacters: string[] = [];
let currentSentenceHead: string;
let currentSentenceBody: string;
let currentSentenceText: string;

// MAIN
export function getUnitsFromSentences(sentences: Sentence[]): Unit[] {
    units = [];

    // first level is same grammar as function body
    scopes = ['function-body'];

    for (
        indexOfCurrentSentence = 0;
        indexOfCurrentSentence < sentences.length;
        indexOfCurrentSentence++
    ) {
        // units
        currentUnit = undefined;
        trailingUnit = undefined;

        // sentences
        currentSentence = sentences[indexOfCurrentSentence];
        currentSentenceType = currentSentence.type;
        currentSentenceCharacters = currentSentence.rawTextCharacters;

        currentSentenceText = currentSentenceCharacters.join('');
        const sentenceParts: HeadAndBody = getHeadAndBody(
            currentSentenceCharacters,
        );
        currentSentenceHead = sentenceParts.head.join('');
        currentSentenceBody = sentenceParts.body.join('');

        let didRecognizeSentence: boolean = false;
        const reognitionFunctions: SentenceRecognitionFunction[] = [
            recognizeTargetLanguageCode,

            recognizeCommentOrCompilerFlag,

            recognizeBoolean,
            recognizeFalsyValue,
            recognizeIntegerOrFloat,
            recognizeString,

            recognizeAccessor,
            recognizeCompoundDataType,

            recognizeParantheses,
            recognizeBooleanOperator,
            recognizeCalculation,

            recognizeClosingKeywords,
            recognizeOpeningKeywords,

            recognizeVariableDeclaration,
            recognizeAssignment,

            recognizeFunctionOrMethodDefinition,

            recognizeEndMarkers,
            recognizeReference,
            recognizeCall,
            recognizeMultiwordUnit,
            recognizeTwoWordCluster,
        ];
        for (let j = 0; j < reognitionFunctions.length; j++) {
            const functionToRun: SentenceRecognitionFunction =
                reognitionFunctions[j];
            didRecognizeSentence = functionToRun();
            if (didRecognizeSentence == true) break;
        }
        if (didRecognizeSentence == false) {
            useFallbackUnit();
        }
        catchEdgeCases();
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

function useFallbackUnit(): void {
    if (currentSentenceCharacters.length == 0) return;
    currentUnit = {
        type: 'unknown',
        text: currentSentenceCharacters.join(''),
    };
}

// multiword
function processClosingMultiwordUnit(
    currentSentenceHead: string,
    currentSentenceBody: string,
): boolean {
    switch (currentSentenceHead) {
        case 'include': {
            currentUnit = {
                type: 'import',
                sourceName: currentSentenceBody,
            };
            break;
        }
        case 'module': {
            currentUnit = {
                type: 'module-name-definition',
                moduleName: currentSentenceBody,
            };
            break;
        }
        case 'returns': {
            currentUnit = {
                type: 'return-type-definition',
                returnType: currentSentenceBody,
            };

            trailingUnit = {
                type: 'function-or-method-definition-end',
            };

            break;
        }
        case 'section': {
            currentUnit = {
                type: 'section-marker',
                sectionName: currentSentenceBody,
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
    currentSentenceHead: string,
    currentSentenceBody: string,
): boolean {
    switch (currentSentenceHead) {
        case 'checkpoint': {
            currentUnit = {
                type: 'checkpoint',
                name: currentSentenceBody,
            };
            break;
        }
        case 'class': {
            currentUnit = {
                type: 'class-head',
                name: currentSentenceBody,
            };

            scopes.push('class-body');
            break;
        }
        case 'function': {
            currentUnit = {
                type: 'function-head',
                name: currentSentenceBody,
            };
            break;
        }
        case 'struct': {
            currentUnit = {
                type: 'struct-head',
                name: currentSentenceBody,
            };

            scopes.push('struct-body');
            break;
        }
        case 'returns': {
            currentUnit = {
                type: 'return-type-definition',
                returnType: currentSentenceBody,
            };

            trailingUnit = {
                type: 'function-or-method-body-start',
            };

            scopes.push('function-body');
            break;
        }
        case 'take': {
            currentUnit = {
                type: 'item-loop-iterator-definition',
                value: currentSentenceBody,
            };

            trailingUnit = {
                type: 'item-loop-body-start',
            };

            scopes.push('loop-body');
            break;
        }
        case 'type': {
            currentUnit = {
                type: 'type-definition-start',
                name: currentSentenceBody,
            };
            scopes.push('type-definition');
            break;
        }
        default: {
            return false;
        }
    }

    return true;
}

// recognition
type SentenceRecognitionFunction = () => boolean;

function recognizeAccessor(): boolean {
    switch (currentSentenceType) {
        case 'accessor-start':
        case 'accessor-end':
        case 'accessor-assignment-marker': {
            if (currentSentenceType == 'accessor-start') {
                scopes.push('accessor');
            } else if (currentSentenceType == 'accessor-end') {
                scopes.pop();
            }

            currentUnit = {
                type: currentSentenceType,
            };
            break;
        }
        case 'accessor-member': {
            currentUnit = {
                type: 'accessor-member',
                name: currentSentenceText,
            };
            break;
        }
        case 'opening': {
            if (getCurrentScopeType() != 'accessor') return false;

            currentUnit = {
                type: 'accessor-method-call-name',
                name: currentSentenceText,
            };
            break;
        }
        default: {
            return false;
        }
    }

    return true;
}

function recognizeAssignment(): boolean {
    if (currentSentenceType != 'assignment-key') return false;

    currentUnit = {
        type: 'assignment-key',
        key: currentSentenceText,
    };

    scopes.push('assignment');
    return true;
}

function recognizeBoolean(): boolean {
    if (currentSentenceText != 'true' && currentSentenceText != 'false')
        return false;
    const booleanValue: 0 | 1 = getValueOfBooleanString(currentSentenceText);

    currentUnit = {
        type: 'boolean',
        value: booleanValue,
    };

    return true;
}

function recognizeBooleanOperator(): boolean {
    switch (currentSentenceType) {
        case 'boolean-operator-not':
        case 'boolean-operator-and':
        case 'boolean-operator-or': {
            currentUnit = {
                type: 'boolean-operator',
                operatorType: currentSentenceType,
            };
            return true;
        }
    }

    return false;
}

function recognizeCalculation(): boolean {
    if (currentSentenceType == undefined) return false;
    // check if type is calculation type
    if (calculationTypeArray.includes(currentSentenceType as any) == false)
        return false;

    currentUnit = {
        type: 'calculation',
        calculationType: currentSentenceType as CalculationType,
    };

    return true;
}

function recognizeCall(): boolean {
    if (currentSentenceType != 'closing' && currentSentenceType != 'opening')
        return false;

    switch (currentSentenceHead) {
        case 'call': {
            currentUnit = {
                type: 'function-call-start',
                name: currentSentenceBody,
            };
            scopes.push('function-call');
            break;
        }
        case 'new': {
            currentUnit = {
                type: 'class-call-start',
                name: currentSentenceBody,
            };
            scopes.push('function-call');
            break;
        }
        default: {
            return false;
        }
    }

    return true;
}

function recognizeClosingKeywords(): boolean {
    if (currentSentenceType != 'closing') return false;

    const sentenceText = currentSentenceCharacters.join('');
    switch (sentenceText) {
        case 'break': {
            currentUnit = {
                type: 'break-keyword',
            };
            break;
        }
        case 'continue': {
            currentUnit = {
                type: 'continue-keyword',
            };
            break;
        }
        case 'return': {
            currentUnit = {
                type: 'return-keyword',
            };
            break;
        }
        default: {
            return false;
        }
    }

    return true;
}

function recognizeCommentOrCompilerFlag(): boolean {
    switch (currentSentenceType) {
        case 'comment':
        case 'compiler-flag': {
            currentUnit = {
                type: currentSentenceType,
                content: currentSentenceCharacters.join(''),
            };

            break;
        }
        default: {
            return false;
        }
    }

    return true;
}

function recognizeCompoundDataType(): boolean {
    if (currentSentenceType != 'opening') return false;

    switch (currentSentenceText) {
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
    if (currentSentenceHead != 'end') return false;

    const endingScopes: { [key: string]: ScopeType } = {
        array: 'array-body',
        case: 'case-body',
        class: 'class-body',
        function: 'function-body',
        method: 'method-body',
        loop: 'loop-body',
        if: 'if-block-body',
        object: 'object-body',
        struct: 'struct-body',
        switch: 'switch-body',
        type: 'type-definition',
    };

    const endingScope: ScopeType | undefined =
        endingScopes[currentSentenceBody];
    if (endingScope == undefined) return false;

    currentUnit = {
        type: 'end-marker',
        endingScope,
    };

    scopes.pop();

    return true;
}

function recognizeFalsyValue(): boolean {
    if (
        currentSentenceText != 'undefined' &&
        currentSentenceText != 'null' &&
        currentSentenceText != 'NaN' &&
        currentSentenceText != 'void'
    )
        return false;

    currentUnit = {
        type: currentSentenceText,
    };

    return true;
}

function recognizeIntegerOrFloat(): boolean {
    if (currentSentenceCharacters.length == 0) return false;
    if (verifyIsNumber(currentSentenceCharacters) == false) return false;
    const parsedNumber: number = parseFloat(currentSentenceText);

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

function recognizeFunctionOrMethodDefinition(): boolean {
    if (currentSentenceType != 'opening') return false;

    switch (currentSentenceHead) {
        case 'function': {
            if (checkIfScopeUsesFunctionGrammar() == false) return false;
            currentUnit = {
                type: 'function-head',
                name: currentSentenceBody,
            };
            break;
        }
        case 'method': {
            currentUnit = {
                type: 'method-head',
                name: currentSentenceBody,
            };
            break;
        }
        default: {
            return false;
        }
    }

    return true;
}

function recognizeMultiwordUnit(): boolean {
    if (currentSentenceType == 'closing') {
        return processClosingMultiwordUnit(
            currentSentenceHead,
            currentSentenceBody,
        );
    } else if (currentSentenceType == 'opening') {
        return processOpeningMultiwordUnit(
            currentSentenceHead,
            currentSentenceBody,
        );
    }

    return false;
}

function recognizeOpeningKeywords(): boolean {
    if (currentSentenceType != 'opening') return false;

    const sentenceText = currentSentenceCharacters.join('');
    switch (sentenceText) {
        case 'break': {
            currentUnit = {
                type: 'break-keyword',
            };
            break;
        }
        case 'case': {
            currentUnit = {
                type: 'case-head',
            };

            scopes.push('case-head');
            break;
        }
        case 'continue': {
            currentUnit = {
                type: 'continue-keyword',
            };
            break;
        }
        case 'count':
        case 'walk':
        case 'until': {
            let loopTypes: { [key: string]: LoopType } = {
                count: 'index',
                walk: 'item',
                until: 'count',
            };
            const loopType: LoopType | undefined =
                loopTypes[currentSentenceHead];
            if (loopType == undefined) return false;

            currentUnit = {
                type: 'item-loop-head',
                loopType,
            };
            break;
        }
        case 'default': {
            currentUnit = {
                type: 'default-case',
            };

            trailingUnit = {
                type: 'case-body-start',
            };

            scopes.push('case-body');

            break;
        }
        case 'do': {
            currentUnit = {
                type: 'conditional-loop-body-start',
            };

            break;
        }
        case 'else': {
            currentUnit = {
                type: 'else-head',
            };

            trailingUnit = {
                type: 'if-body-start',
            };

            break;
        }
        case 'function': {
            currentUnit = {
                type: 'function-definition-start',
            };

            break;
        }
        case 'if':
        case 'elif': {
            let type: 'if-head' | 'elif-head' | undefined = undefined;
            if (currentSentenceHead == 'if') {
                type = 'if-head';
                scopes.push('if-block-body');
            } else if (currentSentenceHead == 'elif') {
                type = 'elif-head';
            }

            if (type == undefined) return false;

            currentUnit = {
                type,
            };

            break;
        }
        case 'initialize': {
            if (getCurrentScopeType() != 'class-body') return false;

            currentUnit = {
                type: 'class-property-initializer',
            };

            break;
        }
        case 'return': {
            currentUnit = {
                type: 'return-keyword',
            };
            break;
        }
        case 'switch': {
            currentUnit = {
                type: 'switch-head',
            };

            scopes.push('switch-head');
            break;
        }
        case 'then': {
            currentUnit = {
                type: 'if-body-start',
            };

            break;
        }
        case 'while': {
            currentUnit = {
                type: 'conditional-loop-head',
            };

            break;
        }
        default: {
            return false;
        }
    }

    return true;
}

function recognizeParantheses(): boolean {
    switch (currentSentenceType) {
        case 'parentheses-start':
        case 'parentheses-end': {
            currentUnit = {
                type: currentSentenceType,
            };
            return true;
        }
    }

    return false;
}

function recognizeReference(): boolean {
    if (currentSentenceCharacters.length == 0) return false;

    for (let i: number = 0; i < currentSentenceCharacters.length; i++) {
        const character: string = currentSentenceCharacters[i];
        if (character == ' ') return false;
        if (character == '.') return false;
    }

    currentUnit = {
        type: 'reference',
        referencedItem: currentSentenceCharacters.join(''),
    };
    return true;
}

function recognizeString(): boolean {
    if (
        currentSentenceType != 'safe-string' &&
        currentSentenceType != 'normal-string'
    )
        return false;

    currentUnit = {
        type: currentSentenceType,
        content: currentSentenceCharacters.join(''),
    };

    return true;
}

function recognizeTargetLanguageCode(): boolean {
    if (currentSentenceType != 'target-language-code') return false;

    currentUnit = {
        type: 'target-language-code',
        code: currentSentenceText,
    };

    return true;
}

function recognizeTwoWordCluster(): boolean {
    if (currentSentenceBody.length == 0) return false;

    // body must contain no space
    for (let i: number = 0; i < currentSentenceBody.length; i++) {
        if (currentSentenceBody[i] == ' ') return false;
    }

    currentUnit = {
        type: 'two-word-cluster',
        first: currentSentenceHead,
        second: currentSentenceBody,
    };

    return true;
}

function recognizeVariableDeclaration(): boolean {
    if (currentSentenceType != 'opening') return false;

    if (currentSentenceHead != 'constant' && currentSentenceHead != 'mutable')
        return false;

    currentUnit = {
        type: 'variable-declatarion',
        isMutable: currentSentenceHead == 'mutable',
        dataType: currentSentenceBody,
    };

    return true;
}

function catchEdgeCases(): void {
    if (trailingUnit != undefined) return;
    const currentScopeType: ScopeType = getCurrentScopeType();

    switch (currentSentenceType) {
        case 'closing': {
            switch (currentScopeType) {
                case 'assignment':
                case 'function-call':
                case 'type-definition': {
                    scopes.pop();
                }
            }

            trailingUnit = {
                type: 'closing',
            };

            break;
        }
        case 'opening': {
            switch (currentScopeType) {
                case 'switch-head': {
                    if (
                        currentUnit != undefined &&
                        currentUnit.type == 'switch-head'
                    )
                        return;

                    trailingUnit = {
                        type: 'switch-body-start',
                    };
                    scopes.pop();
                    scopes.push('switch-body');

                    break;
                }
                case 'case-head': {
                    if (
                        currentUnit != undefined &&
                        currentUnit.type == 'case-head'
                    )
                        return;

                    trailingUnit = {
                        type: 'case-body-start',
                    };
                    scopes.pop();
                    scopes.push('case-body');

                    break;
                }
            }

            break;
        }
    }
}
