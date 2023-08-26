#!/usr/bin/env node

// IMPORTS
import { ParseResult, Sentence, Unit } from "../types/parser";
import { getSentencesFromCode } from "./codeToSentences";
import { getUnitsFromSentences } from "./sentencesToUnits";

// MAIN
export function parseUnicCode(code: string): ParseResult {
    const sentences: Sentence[] = getSentencesFromCode(code);
    console.log(sentences);
    const units: Unit[] = getUnitsFromSentences(sentences);
    console.log(units);

    throw 'incomplete';
}