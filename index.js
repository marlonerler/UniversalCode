#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const parser_1 = require("./compilation/parser");
// MAIN
function getFilePathsFromArguments(args) {
    const filePaths = [];
    for (let i = 0; i < args.length; i++) {
        //skip first two arguments
        if (i < 2)
            continue;
        const argString = args[i];
        filePaths.push(argString);
    }
    return filePaths;
}
function compileFromFilePaths(filePaths) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let i = 0; i < filePaths.length; i++) {
            const pathOfCurrentFile = filePaths[i];
            const textInCurrentFile = yield promises_1.default.readFile(pathOfCurrentFile, { encoding: "utf-8" });
            const parseResult = (0, parser_1.parseUnicCode)(textInCurrentFile);
        }
    });
}
// INIT
const filePaths = getFilePathsFromArguments(process.argv);
compileFromFilePaths(filePaths);
