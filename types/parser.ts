#!/usr/bin/env node

// FUNCTION
export interface ParseResult {
    units: Unit[];
    errors: string[];
    warnings: string[];
    notes: string[];
}

// OTHER
/** Parsed line. Contains information for builder. */
export interface Function {
    name: string;
    returnType: string;
    parameterTypes: string[];
    lineNumber: string;
}

export interface Import {
    sourceName: string;
}

export interface Phrase {
    rawTextCharacters: string[];
    /** Determined by ending symbol (. or :). */
    type: PhraseType;
}

export type PhraseType =
    | 'closing'
    | 'introducing'
    | 'continuing'
    | 'separating'
    | 'assignment-key'
    | 'normal-string'
    | 'safe-string'
    | 'comment';

export interface IntroducingPhraseParts {
    head: string[];
    body: string[];
}

export type Unit =
    | {
        type: 'boolean';
        value: 0 | 1;
    }
    | {
        type: 'undefined';
    }
    | {
        type: 'null';
    }
    | {
        type: 'nan';
    }
    | {
        type: 'integer';
        value: number;
    }
    | {
        type: 'float';
        value: number;
    }

    | {
        type: 'comment';
        comment: string;
    }
    | {
        type: 'import';
        sourceName: string;
    }
    | {
        type: 'module-name-definition';
        moduleName: string;
    }
    | {
        type: 'section-marker';
        sectionName: string;
    }
    | {
        type: 'language-definition';
        targetLanguage: string;
    }
    | {
        type: 'assignment';
        key: string;
        value: string;
    }
    | {
        type: 'Assignment';
        key: string;
        value: string;
    }
    | {
        type: 'variable-declatation';
        isMutable: boolean;
        dataType: string;
        name: string;
        value: Unit;
    }
    | {
        type: 'command-head';
    }
    | {
        type: 'function-head';
        returnType: string;
        name: string;
        parameters: Extract<Unit, { type: 'function-parameter' }>[];
    }
    | {
        type: 'function-parameter';
        dataType: string;
        name: string;
    }
    | {
        type: 'if-head';
        condition: string;
    }
    | {
        type: 'elif-head';
        condition: string;
    }
    | {
        type: 'else-head';
    }
    | {
        type: 'for-head';
        specification: 'object-of-iterable' | 'index-in-iterable' | 'count-until-number';
        variableName: string;
        iterationDenominator: string;
    }
    | {
        type: 'while-head';
        condition: string;
    }

    | {
        type: 'switch-head';
        value: string;
    }
    | {
        type: 'case-definition';
        referenceValue: string;
    }
    | {
        type: 'case-head';
        cases: Extract<Unit, { type: 'case-definition' }>[];
    }

    | {
        type: 'interface-definition';
        name: string;
    }
    | {
        type: 'interface-item';
        name: string;
        dataType: string;
    }
    | {
        type: 'type-definition';
        name: string;
        typeReferences: string[];
    }

    | {
        type: 'end-marker';
        endingScope: ScopeType;
    };

export type ScopeType =
    | 'function-parameter-list'
    | 'function-return-type-definition'
    | 'function-body'
    | 'variable-declaration'
    | 'control-flow-body'
    | 'switch-body'
    | 'case-body';

export interface Variable {
    name: string;
    type: string;
    phraseOfValue: Phrase;
    lineNumber: string;
}
