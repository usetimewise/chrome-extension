import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: [
            ".cache/",
            ".codex-skills/",
            "dist/",
            "figma/",
            "node_modules/"
        ]
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{ts,tsx}"],
        plugins: {
            "react-hooks": reactHooks
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            }
        },
        rules: {
            "no-console": "off",
            "no-undef": "off",
            "no-unused-vars": "off",
            "react-hooks/exhaustive-deps": "warn",
            "react-hooks/rules-of-hooks": "error",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                    varsIgnorePattern: "^_"
                }
            ]
        }
    },
    {
        files: ["scripts/**/*.mjs"],
        languageOptions: {
            globals: {
                console: "readonly",
                process: "readonly"
            }
        }
    },
    {
        files: ["eslint.config.js"],
        languageOptions: {
            globals: {
                process: "readonly"
            }
        }
    }
);
