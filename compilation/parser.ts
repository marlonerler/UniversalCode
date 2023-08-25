#!/usr/bin/env node

// IMPORTS
import { ParseResult, Phrase } from "../types/parser";
import { getPhrasesFromCode } from "./codeToPhrases";

// MAIN
export function parseUnicCode(code: string): ParseResult {
    const phrases: Phrase[] = getPhrasesFromCode(code);

    throw 'incomplete';
}