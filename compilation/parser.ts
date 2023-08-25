#!/usr/bin/env node

// IMPORTS
import { ERR_NO_STATEMENT_TYPE } from "../constants/errors";
import { ParseResult, Phrase, PhraseEndMarkers } from "../types/parser";
import { checkIfCharacterIsSpace, removeOuterSpacesFromString } from "../utility/characters";

// MAIN
export function parseUnicCode(code: string): ParseResult {
    const phrases: Phrase[] = getPhrasesFromCode(code);
    console.log(phrases);

    throw 'incomplete';
}

function getPhrasesFromCode(code: string): Phrase[] {
    const phrases: Phrase[] = [];
    let indexOfCurrentPhrase: number = 0;
    let charactersOfCurrentPhrase: string[] = [];
    let markerOfCurrentString: string|undefined = undefined; 

    //loop over every character
    for (let i: number = 0; i < code.length; i++) {
        let character: string = code[i];

        let endMarker: PhraseEndMarkers;

        function closeCurrentPhrase(shouldCleanString: boolean): void {
            if (endMarker == undefined) {
                throw ERR_NO_STATEMENT_TYPE(i);
            }

            if (charactersOfCurrentPhrase.length == 0) {
                //do not add empty statements
                resetCurrentPhrase(false);
                return;
            }

            let textOfCurrentPhrase: string = charactersOfCurrentPhrase.join('');

            if (shouldCleanString == true) {
                textOfCurrentPhrase = removeOuterSpacesFromString(textOfCurrentPhrase);
            }

            const newPhrase: Phrase = {
                rawText: textOfCurrentPhrase,
                endMarker: endMarker,
            }
            phrases[indexOfCurrentPhrase] = newPhrase;

            resetCurrentPhrase(true);
        }

        function resetCurrentPhrase(shouldIncreaseIndex: boolean): void {
            if (shouldIncreaseIndex) indexOfCurrentPhrase++;
            charactersOfCurrentPhrase = [];
        }
        if (character == '"' || character == '\'') {
            switch (character) {
                case '"': {
                    endMarker = 'safe-string-marker';
                    break;
                }
                case '\'': {
                    endMarker = 'normal-string-marker';
                    break;
                }
            }

            if (markerOfCurrentString == undefined) {
                markerOfCurrentString = character;
                //delete start of previous phrase and start new string
                resetCurrentPhrase(false);
                continue;
            } else if (markerOfCurrentString == character) {
                markerOfCurrentString = undefined;
                closeCurrentPhrase(false);
            } else {
                charactersOfCurrentPhrase.push(character);    
            }
        } else if (markerOfCurrentString != undefined) {
            charactersOfCurrentPhrase.push(character);
        } else if (character == '.' || character == ':') {
            switch (character) {
                case '.': {
                    endMarker = 'final-centence-end-marker';
                    break;
                }
                case ':': {
                    endMarker = 'opening-sentence-end-marker';
                    break;
                }
            }

            closeCurrentPhrase(true);
        } else if (character == ',') {
            endMarker = 'continuous-marker';
            closeCurrentPhrase(true);
        } else if (character == ';') {
            endMarker = 'separating-marker';
            closeCurrentPhrase(true);
        } else if (character == '=') {
            endMarker = 'assignment-marker';
            closeCurrentPhrase(true);
        } else {
            if (character == '\n') {
                //do not preserve newlines
                character = ' ';
            }

            // check if character should be added to statement text
            const leadingCharacter: string | undefined = code[i - 1];
            const characterIsSpace: boolean = checkIfCharacterIsSpace(character);
            const leadingCharacterIsSpace: boolean = leadingCharacter != undefined && checkIfCharacterIsSpace(leadingCharacter);
            const characterShouldBeIgnored: boolean = characterIsSpace == true && leadingCharacterIsSpace == true;

            if (characterShouldBeIgnored) continue;
            charactersOfCurrentPhrase.push(character);
        }
    }

    return phrases;
}