#!/usr/bin/env node

// FUNCTION
export interface ParseResult {
    lines: RawStatement[];
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
    functionName: string;
    returnType: string;
    parameterTypes: string[];
    lineNumber: string;
}

export interface Import {
    sourceName: string;
}

export interface ParsedStatement {
    statementType: string;
    /** Data, depending on lineType. */
    data: {[key: string]: string};
}

export interface RawStatement {
    rawText: string;
    /** Determined by ending symbol (. or :). */
    type: StatementTypes;
}

/** Types of a statement:
 * closed: ending with a period, final.
 * open: ending with a colon, not the end of a block.
 */
export type StatementTypes = 'closed' | 'open' | 'string-normal' | 'string-safe';

export interface Variable {
    variableName: string;
    variableType: string;
    variableValueLine: RawStatement;
    lineNumber: string;
}