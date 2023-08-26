#!/usr/bin/env node

import { ERROR_NO_SENTENCE_RECOGNITION } from '../constants/errors';
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

        let didRecognizeSentence: boolean = false;
        const reognitionFunctions: SentenceRecognitionFunction[] = [
            recognizeComment,

            recognizeBoolean,
            recognizeFalsyValues,
            recognizeIntegerOrFloat,
            recognizeString,
            recognizeCompoundDataTypes,

            recognizeMultiwordUnit,

            recognizeVariableDeclaration,
            recognizeAssignment,

            recognizeCommandHead,
            recognizeCommands,

            recognizeFunctionDefinition,

            recognizeEndMarkers,
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
        type: 'reference',
        referencedItem: currentSentenceCharacters.join(''),
    };
}

// multiword
function processClosingMultiwordUnit(
    sentenceParts: HeadAndBody,
    headString: string,
    bodyString: string,
): boolean {
    switch (headString) {
        case 'import': {
            currentUnit = {
                type: 'import',
                sourceName: sentenceParts.body.join(''),
            };
            break;
        }
        case 'language': {
            currentUnit = {
                type: 'language-definition',
                targetLanguage: sentenceParts.body.join(''),
            };
            break;
        }
        case 'module': {
            currentUnit = {
                type: 'module-name-definition',
                moduleName: sentenceParts.body.join(''),
            };
            break;
        }
        case 'section': {
            currentUnit = {
                type: 'section-marker',
                sectionName: sentenceParts.body.join(''),
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
    sentenceParts: HeadAndBody,
    headString: string,
    bodyString: string,
): boolean {
    switch (headString) {
        case 'case': {
            currentUnit = {
                type: 'case-definition',
                referenceValue: bodyString,
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
    sentenceParts: HeadAndBody,
    headString: string,
    bodyString: string,
): boolean {
    switch (headString) {
        case 'call': {
            currentUnit = {
                type: 'function-call-start',
                functionName: bodyString,
            };
            scopes.push('function-call');
            break;
        }
        case 'case': {
            currentUnit = {
                type: 'case-definition',
                referenceValue: bodyString,
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
                name: bodyString,
            };
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
        case 'struct': {
            currentUnit = {
                type: 'struct-head',
                name: bodyString,
            };

            scopes.push('struct-body');
            break;
        }
        case 'switch': {
            currentUnit = {
                type: 'switch-head',
                variable: bodyString,
            };

            scopes.push('switch-body');
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
                type: 'type-definition-start',
                name: bodyString,
            };
            scopes.push('type-definition');
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
type SentenceRecognitionFunction = () => boolean;

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
    const sentenceParts: HeadAndBody = getHeadAndBody(
        currentSentenceCharacters,
    );
    const headString: string = sentenceParts.head.join('');

    if (headString != 'end') return false;

    const bodyText: string = sentenceParts.body.join('');

    const endingScopes: { [key: string]: ScopeType } = {
        case: 'case-body',
        cmd: 'command-body',
        fn: 'function-body',
        loop: 'loop-body',
        if: 'if-block-body',
        struct: 'struct-body',
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

    const sentenceParts: HeadAndBody = getHeadAndBody(
        currentSentenceCharacters,
    );
    const headString: string = sentenceParts.head.join('');
    const bodyString: string = sentenceParts.body.join('');

    if (headString != 'function') return false;

    currentUnit = {
        type: 'function-head',
        name: bodyString,
    };

    return true;
}

function recognizeMultiwordUnit(): boolean {
    const sentenceParts: HeadAndBody = getHeadAndBody(
        currentSentenceCharacters,
    );
    const headString: string = sentenceParts.head.join('');
    const bodyString = sentenceParts.body.join('');

    if (currentSentenceType == 'closing') {
        return processClosingMultiwordUnit(
            sentenceParts,
            headString,
            bodyString,
        );
    } else if (currentSentenceType == 'opening') {
        return processOpeningMultiwordUnit(
            sentenceParts,
            headString,
            bodyString,
        );
    } else if (currentSentenceType == 'enumerating') {
        return processEnumeratingMultiwordUnit(
            sentenceParts,
            headString,
            bodyString,
        );
    }

    return false;
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
    const sentenceParts: HeadAndBody = getHeadAndBody(
        currentSentenceCharacters,
    );
    if (sentenceParts.body.length == 0) return false;

    const headString: string = sentenceParts.head.join('');

    // body must contain no space
    for (let i: number = 0; i < sentenceParts.body.length; i++) {
        if (sentenceParts.body[i] == ' ') return false;
    }

    const bodyString = sentenceParts.body.join('');

    currentUnit = {
        type: 'two-word-cluster',
        first: headString,
        second: bodyString,
    };

    return true;
}

function recognizeVariableDeclaration(): boolean {
    if (checkIfScopeUsesFunctionGrammar() == false) return false;
    if (currentSentenceType != 'opening') return false;

    const sentenceParts: HeadAndBody = getHeadAndBody(
        currentSentenceCharacters,
    );
    const headString: string = sentenceParts.head.join('');

    if (headString != 'constant' && headString != 'mutable') return false;

    const dataType: string = sentenceParts.body.join('');

    currentUnit = {
        type: 'variable-declatarion',
        isMutable: headString == 'mutable',
        dataType,
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
