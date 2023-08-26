#!/usr/bin/env node

import {
    HeadAndBody,
    LoopType,
    Sentence,
    SentenceType,
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
let indexOfCurrentSentence: number = 0;
let currentSentence: Sentence | undefined;
let currentSentenceType: SentenceType | undefined;
let currentSentenceCharacters: string[] = [];
let currentSentenceHead: string;
let currentSentenceBody: string;

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

        const sentenceParts: HeadAndBody = getHeadAndBody(
            currentSentenceCharacters,
        );
        currentSentenceHead = sentenceParts.head.join('');
        currentSentenceBody = sentenceParts.body.join('');

        let didRecognizeSentence: boolean = false;
        const reognitionFunctions: SentenceRecognitionFunction[] = [
            recognizeComment,

            recognizeBoolean,
            recognizeFalsyValues,
            recognizeIntegerOrFloat,
            recognizeString,

            recognizeAccessor,
            recognizeCompoundDataTypes,

            recognizeOpeningKeywords,
            recognizeClosingKeywords,

            recognizeVariableDeclaration,
            recognizeAssignment,

            recognizeCommandHead,
            recognizeCommands,

            recognizeFunctionDefinition,

            recognizeEndMarkers,
            recognizeReferences,
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
        // process unit for edge cases
        catchOther();
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
        case 'import': {
            currentUnit = {
                type: 'import',
                sourceName: currentSentenceBody,
            };
            break;
        }
        case 'language': {
            currentUnit = {
                type: 'language-definition',
                targetLanguage: currentSentenceBody,
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
                type: 'function-type-definition-return-type',
                returnType: currentSentenceBody,
            };

            scopes.push('function-body');
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

function processEnumeratingMultiwordUnit(
    currentSentenceHead: string,
    currentSentenceBody: string,
): boolean {
    switch (currentSentenceHead) {
        case 'case': {
            currentUnit = {
                type: 'case-definition',
                referenceValue: currentSentenceBody,
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
                iterableName: currentSentenceBody,
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
        case 'call': {
            currentUnit = {
                type: 'function-call-start',
                functionName: currentSentenceBody,
            };
            scopes.push('function-call');
            break;
        }
        case 'case': {
            currentUnit = {
                type: 'case-definition',
                referenceValue: currentSentenceBody,
            };

            trailingUnit = {
                type: 'case-definition-end',
            };

            scopes.push('case-body');
            break;
        }
        case 'function': {
            currentUnit = {
                type: 'function-head',
                name: currentSentenceBody,
            };
            break;
        }
        case 'if':
        case 'elif': {
            let type: 'if-head' | 'elif-head' | undefined = undefined;
            if (currentSentenceHead == 'if') {
                type = 'if-head';
            } else if (currentSentenceHead == 'elif') {
                type = 'elif-head';

                //elif closes previous if scope
                scopes.pop();
            }

            if (type == undefined) return false;

            currentUnit = {
                type,
                condition: currentSentenceBody,
            };

            scopes.push('if-block-body');
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
        case 'switch': {
            currentUnit = {
                type: 'switch-head',
                variable: currentSentenceBody,
            };

            scopes.push('switch-body');
            break;
        }
        case 'returns': {
            currentUnit = {
                type: 'function-return-type',
                returnType: currentSentenceBody,
            };

            scopes.push('function-body');
            break;
        }
        case 'take': {
            currentUnit = {
                type: 'loop-iterator-name-definition',
                value: currentSentenceBody,
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
        case 'while': {
            currentUnit = {
                type: 'while-loop-head',
                condition: currentSentenceBody,
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
type SentenceRecognitionFunction = () => boolean;

function recognizeAccessor(): boolean {
    if (currentSentenceType != 'accessor') return false;

    const accessedItemCharacters: string[] = [];
    const members: string[] = [];
    let currentMemberCharacters: string[] = [];

    let methodNameCharacters: string[] = [];
    let methodParameters: string[] = [];
    let currentMethodParameterCharacters: string[] = [];

    let isDefiningMembers: boolean = false;
    let isDefiningMethodName: boolean = false;
    let isDefiningMethodParameters: boolean = false;

    for (let i: number = 0; i < currentSentenceCharacters.length; i++) {
        const currentCharacter: string = currentSentenceCharacters[i];
        const leadingCharacter: string = currentSentenceCharacters[i - 1];

        // no repeating spaces
        if (currentCharacter == ' ' && leadingCharacter == ' ') continue;

        const isLastCharacter: boolean =
            i === currentSentenceCharacters.length - 1;
        const isSpace: boolean = currentCharacter == ' ';
        const isPeriod: boolean = currentCharacter == '.';
        const isComma: boolean = currentCharacter == ',';
        const isColon: boolean = currentCharacter == ':';

        const isNotWordCharacter =
            isSpace == true ||
            isPeriod == true ||
            isComma == true ||
            isColon == true;

        if (isDefiningMethodParameters == true) {
            if (isSpace == true) continue;
            if (isComma == false) {
                currentMethodParameterCharacters.push(currentCharacter);
            }

            if (isComma == true || isLastCharacter == true) {
                methodParameters.push(
                    currentMethodParameterCharacters.join(''),
                );
                currentMethodParameterCharacters = [];
                continue;
            }
        } else if (isDefiningMethodName == true) {
            if (isColon == true) {
                isDefiningMethodParameters = true;
                continue;
            }

            methodNameCharacters.push(currentCharacter);
        } else if (isDefiningMembers) {
            if (isSpace == true) {
                isDefiningMethodName = true;
            }

            if (isNotWordCharacter == false) {
                currentMemberCharacters.push(currentCharacter);
            }

            if (
                isSpace == true ||
                isPeriod == true ||
                isLastCharacter == true
            ) {
                members.push(currentMemberCharacters.join(''));
                currentMemberCharacters = [];
                continue;
            }
        } else {
            if (isPeriod == true) {
                isDefiningMembers = true;
                continue;
            }
            if (isSpace == true) {
                isDefiningMethodName = true;
                continue;
            }
            accessedItemCharacters.push(currentCharacter);
        }
    }

    let methodName: string | undefined = undefined;
    if (methodNameCharacters.length > 0) {
        methodName = methodNameCharacters.join('');
    }

    currentUnit = {
        type: 'accessor',
        accessedItem: accessedItemCharacters.join(''),
        members: members,
        methodName,
        methodParameters,
    };

    return true;
}

function recognizeAssignment(): boolean {
    if (currentSentenceType != 'assignment-key') return false;

    const sentenceText: string = currentSentenceCharacters.join('');

    currentUnit = {
        type: 'assignment',
        key: sentenceText,
    };

    return true;
}

function recognizeBoolean(): boolean {
    const sentenceText: string = currentSentenceCharacters.join('');
    if (sentenceText != 'true' && sentenceText != 'false') return false;
    const booleanValue: 0 | 1 = getValueOfBooleanString(sentenceText);

    currentUnit = {
        type: 'boolean',
        value: booleanValue,
    };

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
        default: {
            return false;
        }
    }

    return true;
}

function recognizeCommandHead(): boolean {
    if (checkIfScopeUsesFunctionGrammar() == false) return false;
    if (currentSentenceType != 'opening') return false;

    const sentencceText = currentSentenceCharacters.join('');
    if (sentencceText != 'command') return false;

    currentUnit = {
        type: 'command-head',
    };

    scopes.push('command-body');
    return true;
}

function recognizeCommands(): boolean {
    if (getCurrentScopeType() != 'command-body') return false;
    if (currentSentenceType != 'opening') return false;

    const sentenceText: string = currentSentenceCharacters.join('');

    currentUnit = {
        type: 'command',
        commandName: sentenceText,
    };

    return true;
}

function recognizeComment(): boolean {
    if (currentSentenceType != 'comment') return false;

    currentUnit = {
        type: 'comment',
        content: currentSentenceCharacters.join(''),
    };

    return true;
}

function recognizeCompoundDataTypes(): boolean {
    if (currentSentenceType != 'opening') return false;

    const sentenceText: string = currentSentenceCharacters.join('');

    switch (sentenceText) {
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
        case: 'case-body',
        cmd: 'command-body',
        fn: 'function-body',
        loop: 'loop-body',
        if: 'if-block-body',
        struct: 'struct-body',
        switch: 'switch-body',
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

function recognizeFalsyValues(): boolean {
    const sentenceText: string = currentSentenceCharacters.join('');
    if (
        sentenceText != 'undefined' &&
        sentenceText != 'null' &&
        sentenceText != 'NaN' &&
        sentenceText != 'void'
    )
        return false;

    currentUnit = {
        type: sentenceText,
    };

    return true;
}

function recognizeIntegerOrFloat(): boolean {
    const sentenceText: string = currentSentenceCharacters.join('');
    const parsedNumber: number = parseFloat(sentenceText);

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
    if (currentSentenceType != 'opening') return false;

    if (currentSentenceHead != 'function') return false;

    currentUnit = {
        type: 'function-head',
        name: currentSentenceBody,
    };

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
    } else if (currentSentenceType == 'enumerating') {
        return processEnumeratingMultiwordUnit(
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
        case 'else': {
            currentUnit = {
                type: 'else-head',
            };

            break;
        }
        case 'function': {
            currentUnit = {
                type: 'function-type-definition',
            };

            break;
        }
        case 'method': {
            currentUnit = {
                type: 'method-head',
            };

            break;
        }
        case 'return': {
            currentUnit = {
                type: 'return-keyword',
            };
            break;
        }
        case 'yield': {
            currentUnit = {
                type: 'yield-keyword',
            };
            break;
        }
        default: {
            return false;
        }
    }

    return true;
}

function recognizeReferences(): boolean{
    // body means whitespace but reference must not have whitespace
    if (currentSentenceBody.length > 0) return false;

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
    if (checkIfScopeUsesFunctionGrammar() == false) return false;
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

function catchOther(): boolean {
    if (currentSentenceType == 'closing') {
        switch (getCurrentScopeType()) {
            case 'array-body': {
                scopes.pop();

                trailingUnit = {
                    type: 'array-end',
                };
                break;
            }
            case 'function-call': {
                scopes.pop();

                trailingUnit = {
                    type: 'function-call-end',
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
            case 'type-definition': {
                scopes.pop();

                trailingUnit = {
                    type: 'type-definition-end',
                };
                break;
            }
        }
    }

    return false;
}
