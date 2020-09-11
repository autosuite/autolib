/**
 * This file tests the methods for the exportable [[SemVer]] type.
 */

import {expect} from 'chai';

import {SemVer} from "../../types/SemVer";


describe("SemVer.constructFromText (nominal)", () => {
    const parameters: {
        text: string;
        expectedMajor: number;
        expectedMinor: number;
        expectedPatch: number;
        expectedInfo: string | null;
    }[] = [
        /* SemVers with some extremes, some zeroes, and no info strings. */

        {
            "text": "0.1.5",
            "expectedMajor": 0,
            "expectedMinor": 1,
            "expectedPatch": 5,
            "expectedInfo": null,
        },
        {
            "text": "912418.0.12419",
            "expectedMajor": 912418,
            "expectedMinor": 0,
            "expectedPatch": 12419,
            "expectedInfo": null,
        },
        {
            "text": "00.00124.0124",
            "expectedMajor": 0,
            "expectedMinor": 124,
            "expectedPatch": 124,
            "expectedInfo": null,
        },
        {
            "text": "3.31.12412",
            "expectedMajor": 3,
            "expectedMinor": 31,
            "expectedPatch": 12412,
            "expectedInfo": null,
        },
        {
            "text": "0.0.0",
            "expectedMajor": 0,
            "expectedMinor": 0,
            "expectedPatch": 0,
            "expectedInfo": null,
        },

        /* SemVers with info strings. */

        {
            "text": "0.10.5-rc2",
            "expectedMajor": 0,
            "expectedMinor": 10,
            "expectedPatch": 5,
            "expectedInfo": "-rc2"
        },
        {
            "text": "123.456.789-rc2+build2",
            "expectedMajor": 123,
            "expectedMinor": 456,
            "expectedPatch": 789,
            "expectedInfo": "-rc2+build2",
        },
        {
            "text": "124124.1110.512-rc5+2020-06-25",
            "expectedMajor": 124124,
            "expectedMinor": 1110,
            "expectedPatch": 512,
            "expectedInfo": "-rc5+2020-06-25",
        },
        {
            "text": "0001.10.22-invalid but supported",
            "expectedMajor": 1,
            "expectedMinor": 10,
            "expectedPatch": 22,
            "expectedInfo": "-invalid but supported",
        },
        {
            "text": "0432.1098.5124-14uua(*!@Y*&",
            "expectedMajor": 432,
            "expectedMinor": 1098,
            "expectedPatch": 5124,
            "expectedInfo": "-14uua(*!@Y*&",
        },
    ];

    parameters.forEach(group => it(
        `...parses correctly when the input is: "${group.text}"`, () => {
            const version: SemVer = SemVer.constructFromText(group.text);

            expect([version.major, version.minor, version.patch, version.info]).to.eql([
                group.expectedMajor, group.expectedMinor, group.expectedPatch, group.expectedInfo,
            ]);
        }
    ));
});
