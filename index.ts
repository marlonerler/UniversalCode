#!/usr/bin/env node

import Fs from 'fs/promises';
import { ParseResult } from './types/parser';
import { parseUnicCode } from './compilation/parser';

// MAIN
function getFilePathsFromArguments(args: string[]): string[] {
    const filePaths: string[] = [];
    for (let i: number = 0; i < args.length; i++) {
        //skip first two arguments
        if (i < 2) continue;
        
        const argString: string = args[i];
        filePaths.push(argString);
    }

    return filePaths;
}

async function compileFromFilePaths(filePaths: string[]): Promise<void> {
    for (let i: number = 0; i < filePaths.length; i++) {
        const pathOfCurrentFile: string = filePaths[i];
        const textInCurrentFile: string = await Fs.readFile(pathOfCurrentFile, {encoding:"utf-8"});
        const parseResult: ParseResult = parseUnicCode(textInCurrentFile);
    }
}

// INIT
const filePaths: string[] = getFilePathsFromArguments(process.argv);
compileFromFilePaths(filePaths);