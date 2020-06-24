/**
 * This file tests the methods for the exportable [[SemVer]] type.
 */

import { describe, expect } from "@jest/globals";

import each from "jest-each";

import { SemVer } from "../index";

describe("SemVer.constructFromText (nominal)", () => {
    each([
        /* SemVers with some extremes, some zeroes, and no info strings. */

        ["0.10.5", 0, 10, 5, null],
        ["912418.0.12419", 1, 3, 10, null],
        ["00.00124.0124", 1, 3, 10, null],
        ["3.31.12412", 1, 3, 10, null],
        ["0.0.124192412", 1, 3, 10, null],
        ["0.0.0", 1, 3, 10, null],

        /* SemVers with info strings. */

        ["0.10.5-rc2", 0, 10, 5, "rc2"],
        ["123.456.789-rc2+build2", 123, 456, 789, "rc2+build2"],
        ["124124.1110.512-rc5+2020-06-25", 124124, 1110, 512, "rc5+2020-06-25"],
        ["0001.10.22-invalid but supported", 1, 10, 22, "invalid but supported"],
        ["0432.1098.5124-124uliuawnliu1248asd8(*!@Y*&", 432, 1098, 5124, "124uliuawnliu1248asd8(*!@Y*&"],
    ]).it(
        "when the input is '%s'", (text, expectedMajor, expectedMinor, expectedPatch, expectedInfo) => {
            const version: SemVer = SemVer.constructFromText(text);

            expect(version.major).toBe(expectedMajor);
            expect(version.minor).toBe(expectedMinor);
            expect(version.patch).toBe(expectedPatch);
            expect(version.info).toBe(expectedInfo);
        });
});

// test('constructing SemVer from text without info string is consistent', () => {
//     SemVer.constructFromText("")
//     expect(sum(1, 2)).toBe(3);
// });

// test('constructing SemVer from text with an info string is consistent', () => {
//     expect(sum(1, 2)).toBe(3);
// });

// test('constructing SemVer with all zeros is consistent', () => {
//     expect(sum(1, 2)).toBe(3);
// });

// test('representing a SemVer without info is consistent', () => {
//     expect(sum(1, 2)).toBe(3);
// });

// test('representing a SemVer with info is consistent', () => {
//     expect(sum(1, 2)).toBe(3);
// });
