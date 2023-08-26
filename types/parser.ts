#!/usr/bin/env node

// FUNCTION
export interface ParseResult {
    units: Unit[];
    errors: string[];
    warnings: string[];
    notes: string[];
}

// OTHER
export type BooleanOperator =
    | 'boolean-operator-and'
    | 'boolean-operator-or'
    | 'boolean-operator-not';

export type CalculationType =
    | 'calculation-assignment-add'
    | 'calculation-assignment-divide'
    | 'calculation-assignment-multiply'
    | 'calculation-assignment-subtract'
    | 'calculation-add'
    | 'calculation-divide'
    | 'calculation-multiply'
    | 'calculation-subtract'
    | 'calculation-comparison-lower'
    | 'calculation-comparison-greater'
    | 'calculation-comparison-lower-equal'
    | 'calculation-comparison-greater-equal'
    | 'calculation-comparison-is-equal'
    | 'calculation-comparison-not-equal';
export const calculationTypeArray: CalculationType[] = [
    'calculation-assignment-add',
    'calculation-assignment-divide',
    'calculation-assignment-multiply',
    'calculation-assignment-subtract',
    'calculation-add',
    'calculation-divide',
    'calculation-multiply',
    'calculation-subtract',
    'calculation-comparison-lower',
    'calculation-comparison-greater',
    'calculation-comparison-lower-equal',
    'calculation-comparison-greater-equal',
    'calculation-comparison-is-equal',
    'calculation-comparison-not-equal',
];

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
    | 'unknown'
    | BooleanOperator
    | CalculationType
    | 'accessor'
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
          type: 'unknown';
          text: string;
      }
    | {
          type: 'closing';
      }
    | {
          type: 'boolean-operator';
          operatorType: BooleanOperator;
      }
      | {
        type: 'calculation';
        calculationType: CalculationType;
    }
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
          type: 'accessor';
          accessedItem: string;
          members: string[];
          methodName: string | undefined;
          methodParameters: string[];
      }
    | {
          type: 'array-start';
      }
    | {
          type: 'object-start';
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
          type: 'assignment-key';
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
          type: 'function-type-definition';
      }
    | {
          type: 'function-type-definition-return-type';
          returnType: string;
      }
    | {
          type: 'function-head';
          name: string;
      }
    | {
          type: 'method-head';
      }
    | {
          type: 'function-return-type';
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
          type: 'return-keyword';
      }
    | {
          type: 'continue-keyword';
      }
    | {
          type: 'break-keyword';
      }
    | {
          type: 'yield-keyword';
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
          type: 'end-marker';
          endingScope: ScopeType;
      };

export type ScopeType =
    | 'array-body'
    | 'assignment'
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
