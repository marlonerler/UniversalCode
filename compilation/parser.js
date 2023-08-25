#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseUnicCode = void 0;
const codeToPhrases_1 = require("./codeToPhrases");
// MAIN
function parseUnicCode(code) {
    const phrases = (0, codeToPhrases_1.getPhrasesFromCode)(code);
    throw 'incomplete';
}
exports.parseUnicCode = parseUnicCode;
