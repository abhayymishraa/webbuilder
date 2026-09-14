import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    {
        files: ["**/*.{ts,tsx}"],
        rules: {
            "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
        },
    },
    {
        files: ["app/**/page.tsx", "app/**/layout.tsx"],
        rules: {
            "max-lines": ["error", { max: 80, skipBlankLines: true, skipComments: true }],
        },
    },
    {
        files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: ["@/services/*", "@/lib/http/*", "axios"],
                            message:
                                "Keep requests in services and orchestration in feature hooks.",
                        },
                    ],
                },
            ],
        },
    },
    // Override default ignores of eslint-config-next.
    globalIgnores([
        // Default ignores of eslint-config-next:
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
    ]),
]);

export default eslintConfig;
