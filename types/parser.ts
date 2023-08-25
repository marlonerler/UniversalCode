#!/usr/bin/env node

// FUNCTION
export interface ParseResult {
    lines: Phrase[];
    errors: string[];
    warnings: string[];
    notes: string[];
}

export interface StringExtractionResult {
    codeWithoutStrings: string;
    strings: String[];
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

export interface Statement {
    statementType: string;
    /** Data, depending on lineType. */
    data: {[key: string]: string};
}

export interface Phrase {
    rawText: string;
    /** Determined by ending symbol (. or :). */
    endMarker: PhraseEndMarkers;
}

/** Types of a statement:
 * closed: ending with a period, final.
 * open: ending with a colon, not the end of a block.
 */
export type PhraseEndMarkers = 'final-centence-end-marker' | 'opening-sentence-end-marker' | 'continuous-marker' | 'separating-marker' | 'assignment-marker' | 'normal-string-marker' | 'safe-string-marker';

export interface Variable {
    name: string;
    type: string;
    phraseOfValue: Phrase;
    lineNumber: string;
}