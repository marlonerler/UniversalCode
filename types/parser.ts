#!/usr/bin/env node

// FUNCTION
export interface ParseResult {
    statements: Statement[];
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

/** Types of a statement:
 * closed: ending with a period, final.
 * open: ending with a colon, not the end of a block.
 */
export type PhraseType =
    'closing' |
    'introducing' |
    
    'continuing' |
    'separating' |

    'assignment-key' |

    'normal-string' |
    'safe-string' |

    'comment';


export interface Statement {
    statementType: string;
    /** Data, depending on lineType. */
    data: { [key: string]: string };
}
export interface IntroducingStatementParts {
    head: string[];
    body: string[];
}

export type ScopeType = 
    'function-head' |
    'function-body' |

    'variable-declaration' |

    'control-flow-body' |

    'switch-body' |
    'case-body';

export interface Variable {
    name: string;
    type: string;
    phraseOfValue: Phrase;
    lineNumber: string;
}