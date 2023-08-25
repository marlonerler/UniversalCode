#!/usr/bin/env node

// IMPORTS
import { ParseResult, Phrase, Unit } from "../types/parser";
import { getPhrasesFromCode } from "./codeToPhrases";
import { getUnitsFromPhrases } from "./phrasesToUnits";

// MAIN
export function parseUnicCode(code: string): ParseResult {
    const phrases: Phrase[] = getPhrasesFromCode(code);
    const units: Unit[] = getUnitsFromPhrases(phrases);
    console.log(units);

    throw 'incomplete';
}