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
    | 'parentheses-start'
    | 'parentheses-end'
    | 'safe-string'
    | 'target-language-code';

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
          type: 'target-language-code';
          code: string;
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
          type: 'parentheses-start';
      }
    | {
          type: 'parentheses-end';
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
          type: 'function-head';
          name: string;
      }
    | {
          type: 'method-head';
          name: string;
      }
    | {
          type: 'return-type-definition';
          returnType: string;
      }
    | {
          type: 'function-or-method-body-start';
      }
    | {
          type: 'function-or-method-definition-end';
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
          type: 'checkpoint';
          name: string;
      }
    | {
          type: 'continue-keyword';
      }
    | {
          type: 'break-keyword';
      }
    | {
          type: 'if-head';
      }
    | {
          type: 'elif-head';
      }
    | {
          type: 'else-head';
      }
    | {
          type: 'if-body-start';
      }
    | {
          type: 'item-loop-head';
          loopType: LoopType;
      }
    | {
          type: 'item-loop-iterator-definition';
          value: string;
      }
    | {
          type: 'item-loop-body-start';
      }
    | {
          type: 'conditional-loop-head';
      }
    | {
          type: 'conditional-loop-body-start';
      }
    | {
          type: 'switch-head';
      }
    | {
          type: 'switch-body-start';
      }
    | {
          type: 'case-head';
      }
    | {
          type: 'default-case';
      }
    | {
          type: 'case-body-start';
      }
    | {
          type: 'struct-head';
          name: string;
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
    | 'case-head'
    | 'case-body'
    | 'control-flow-body'
    | 'command-body'
    | 'if-block-body'
    | 'function-call'
    | 'function-body'
    | 'loop-body'
    | 'method-body'
    | 'object-body'
    | 'struct-body'
    | 'switch-head'
    | 'switch-body'
    | 'type-definition';

export const scopesWithFunctionGrammar: ScopeType[] = [
    'case-body',
    'control-flow-body',
    'if-block-body',
    'function-body',
    'loop-body',
    'method-body',
    'switch-body',
];
