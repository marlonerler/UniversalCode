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

export type Node =
    | {
          type: 'target-language-code';
          text: string;
      }
    | {
          type: 'boolean-operator';
          operatorType: BooleanOperator;
      }
    | {
          type: 'calculation-operator';
          calculationType: CalculationType;
      }
    | {
          type: 'calculation';
          items: Node[];
      }
    | {
          type: 'parentheses';
          items: Node[];
      }
    | {
          type: 'boolean';
          value: 0 | 1;
      }
    | {
          type: 'undeifned';
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
          objectName: Node;
          members: Node[];
      }
    | {
          type: 'accessor-method-call';
          accessor: Extract<Node, { type: 'accessor' }>;
          methodName: Node;
          parameters: Node[];
      }
    | {
          type: 'array';
          items: Node[];
      }
    | {
          type: 'object';
          items: Extract<Node, { type: 'obect-property' }>;
      }
    | {
          type: 'object-property';
          pathFromObjectRoot: string[];
          value: Node;
      }
    | {
          type: 'string';
          stringType: 'safe' | 'normal';
          text: string;
      }
    | {
          type: 'comment';
          text: string;
      }
    | {
          type: 'compiler-flag';
          text: string;
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
          type: 'assignment';
          referencedItem: string;
          assignedValue: Node;
      }
    | {
          type: 'variable-declaration';
          isMutable: boolean;
          dataType: string;
          initialValue: Node;
      }
    | {
          type: 'function';
          functionName: boolean;
          returnType: string;
          parameters: [string, string][];
          content: Node[];
      }
    | {
          type: 'method';
          methodName: boolean;
          returnType: string;
          parameters: [string, string][];
          content: Node[];
      }
    | {
          type: 'function-definition';
          functionName: boolean;
          returnType: string;
          parameters: [string, string][];
      }
    | {
          type: 'method-definition';
          methodName: boolean;
          returnType: string;
          parameters: [string, string][];
      }
    | {
          type: 'function-call';
          functionName: boolean;
          parameters: string[];
      }
    | {
          type: 'return-keyword';
          returnValue: Unit | undefined;
      }
    | {
          type: 'checkpoint';
          checkpointName: string;
      }
    | {
          type: 'continue-keyword';
          checkpointName: string | undefined;
      }
    | {
          type: 'break-keyword';
          checkpointName: string | undefined;
      }
    | {
          type: 'if-block';
          condition: Unit;
          content: Node[];
      }
    | {
          type: 'elif-head';
          condition: Unit;
          content: Node[];
      }
    | {
          type: 'else';
          content: Node[];
      }
    | {
          type: 'item-loop';
          referencedItem: Unit;
          iteratorName: string;
          content: Node[];
      }
    | {
          type: 'conditional-loop';
          condition: Unit;
          content: Node[];
      }
    | {
          type: 'switch';
          referencedItem: Unit;
          content: Extract<Unit, { type: 'case' }>[];
      }
    | {
          type: 'case';
          cases: Unit[] | undefined;
          content: Unit[];
      }
    | {
          type: 'struct';
          structName: string;
          properties: [string, string][];
          nestedStructs: Extract<Unit, { type: 'struct' }>[];
      }
    | {
          type: 'type-definition';
          typeName: string;
          types: [string, string][];
      };

export interface Sentence {
    rawTextCharacters: string[];
    /** Determined by ending symbol (. or :). */
    type: SentenceType;
}

export type SentenceType =
    | 'unknown'
    | BooleanOperator
    | CalculationType
    | 'accessor-start'
    | 'accessor-member'
    | 'accessor-last-item'
    | 'accessor-assignment-marker'
    | 'accessor-end'
    | 'assignment-key'
    | 'comment'
    | 'compiler-flag'
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
          type: 'reference';
          referencedItem: string;
      }
    | {
          type: 'accessor-start';
      }
    | {
          type: 'accessor-end';
      }
    | {
          type: 'accessor-member';
          name: string;
      }
    | {
          type: 'accessor-assignment-marker';
      }
    | {
          type: 'accessor-method-call-name';
          name: string;
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
          type: 'compiler-flag';
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
          type: 'assignment-key';
          key: string;
      }
    | {
          type: 'variable-declatarion';
          isMutable: boolean;
          dataType: string;
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
          type: 'function-definition-start';
      }
    | {
          type: 'function-or-method-definition-end';
      }
    | {
          type: 'function-call-start';
          name: string;
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
          type: 'class-head';
          name: string;
      }
    | {
          type: 'class-property-initializer';
      }
    | {
          type: 'class-call-start';
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
    | 'accessor'
    | 'array-body'
    | 'assignment'
    | 'case-head'
    | 'case-body'
    | 'class-body'
    | 'control-flow-body'
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
