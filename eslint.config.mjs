import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

import noUnicodePolicy from "./eslint-rules/no-unicode-policy.js";

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  files: ["**/*.{ts,tsx,js,jsx}"],
  plugins: {
    "no-unicode-policy": noUnicodePolicy,
  },
  rules: {
    // STD-DOC-003 No-Unicode Policy v2.3
    // [C] Critical - production code
    "no-unicode-policy/no-emoji": "error",
    "no-unicode-policy/no-unicode-graphics": "error",
    // STD-DOC-003 section 10.3: enable no-irregular-whitespace
    "no-irregular-whitespace": "error",

    // TypeScript rules
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/prefer-as-const": "off",
    "@typescript-eslint/no-unused-disable-directive": "off",

    // React rules
    "react-hooks/exhaustive-deps": "off",
    "react-hooks/purity": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "react-compiler/react-compiler": "off",

    // Next.js rules
    "@next/next/no-img-element": "off",
    "@next/next/no-html-link-for-pages": "off",

    // General JavaScript rules
    "prefer-const": "off",
    "no-unused-vars": "off",
    "no-console": "off",
    "no-debugger": "off",
    "no-empty": "off",
    "no-case-declarations": "off",
    "no-fallthrough": "off",
    "no-mixed-spaces-and-tabs": "off",
    "no-redeclare": "off",
    "no-undef": "off",
    "no-unreachable": "off",
    "no-useless-escape": "off",
  },
}, {
  // Markdown files: [W] Warning level
  files: ["**/*.md/**"],
  plugins: {
    "no-unicode-policy": noUnicodePolicy,
  },
  rules: {
    "no-unicode-policy/no-emoji": "warn",
    "no-unicode-policy/no-unicode-graphics": "warn",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills/**", "download/**", "tool-results/**", "eslint-rules/**", "upload/**", "agent-ctx/**", "scripts/**"]
}];

export default eslintConfig;
