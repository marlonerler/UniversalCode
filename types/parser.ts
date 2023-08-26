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

export type LoopType = 'index' | 'item' | 'count';

export interface Sentence {
    rawTextCharacters: string[];
    /** Determined by ending symbol (. or :). */
    type: SentenceType;
}

export type SentenceType =
    | 'acccess-open'
    | 'acccess-close'
    | 'assignment-key'
    | 'comment'
    | 'closing'
    | 'enumerating'
    | 'normal-string'
    | 'opening'
    | 'safe-string';

export interface HeadAndBody {
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
          type: 'NaN';
      }
    | {
          type: 'void';
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
          type: 'reference';
          referencedItem: string;
      }
    | {
          type: 'array-start';
      }
    | {
          type: 'array-end';
      }
    | {
          type: 'object-start';
      }
    | {
          type: 'object-end';
      }
    | {
          type: 'normal-string';
          content: string;
      }
    | {
          type: 'safe-string';
          content: string;
      }
    | {
          type: 'two-word-cluster';
          first: string;
          second: string;
      }
    | {
          type: 'comment';
          content: string;
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
      }
    | {
          type: 'variable-declatarion';
          isMutable: boolean;
          dataType: string;
      }
    | {
          type: 'command-head';
      }
    | {
          type: 'command';
          commandName: string;
      }
    | {
          type: 'function-head';
          name: string;
      }
    | {
          type: 'function-return-type-annotation';
          returnType: string;
      }
    | {
          type: 'function-call-start';
          functionName: string;
      }
    | {
          type: 'function-call-end';
      }
    | {
          type: 'return-statement';
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
          type: 'item-loop-head';
          loopType: LoopType;
          iterableName: string;
      }
    | {
          type: 'while-loop-head';
          condition: string;
      }
    | {
          type: 'loop-iterator-name-definition';
          value: string;
      }
    | {
          type: 'switch-head';
          variable: string;
      }
    | {
          type: 'case-definition';
          referenceValue: string;
      }
    | {
          type: 'case-definition-end';
      }
    | {
          type: 'struct-head';
          name: string;
      }
    | {
          type: 'struct-end';
      }
    | {
          type: 'type-definition-start';
          name: string;
      }
    | {
          type: 'type-definition-end';
      }
    | {
          type: 'end-marker';
          endingScope: ScopeType;
      };

export type ScopeType =
    | 'array-body'
    | 'case-body'
    | 'control-flow-body'
    | 'command-body'
    | 'if-block-body'
    | 'function-call'
    | 'function-body'
    | 'loop-body'
    | 'object-body'
    | 'struct-body'
    | 'switch-body'
    | 'type-definition';

export const scopesWithFunctionGrammar: ScopeType[] = [
    'case-body',
    'control-flow-body',
    'if-block-body',
    'loop-body',
    'function-body',
    'switch-body',
];
