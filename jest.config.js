module.exports = {
    "testPathIgnorePatterns": [
        "/node_modules/",
        "/dist/",
    ],
    "testRegex": "(/src/__tests__/.*|(\\.|/)(test|spec))\\.([jt]sx?)$",
    "transform": {
        "^.+\\.ts?$": "ts-jest",
    },
    "moduleFileExtensions": ["ts", "tsx", "js", "jsx", "json", "node"],
};
