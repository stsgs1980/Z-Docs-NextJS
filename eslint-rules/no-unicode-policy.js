// eslint-rules/no-unicode-policy.js
// STD-DOC-003 No-Unicode Policy v2.3 — Automated enforcement
module.exports = {
  configs: {
    recommended: {
      plugins: ["no-unicode-policy"],
      rules: {
        "no-unicode-policy/no-emoji": "error",
        "no-unicode-policy/no-unicode-graphics": "error",
        "no-unicode-policy/no-emoji-in-md": "warn",
        "no-unicode-policy/no-unicode-graphics-in-md": "warn",
      },
    },
  },
  rules: {
    // Rule 1: no-emoji
    // Context: Production code (.ts, .tsx, .js, .jsx)
    // Level: [C] Critical
    "no-emoji": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow emoji in production code (STD-DOC-003 section 4.1, level [C])",
          category: "Unicode Policy",
          recommended: true,
        },
        messages: {
          emojiInLiteral:
            "Emoji are prohibited in production code [C]. Use SVG icons or text alternatives instead. (STD-DOC-003 section 4.1)",
          emojiInTemplate:
            "Emoji are prohibited in template literals [C]. Use SVG icons or text alternatives instead. (STD-DOC-003 section 4.1)",
          emojiInJSX:
            "Emoji are prohibited in JSX text [C]. Use SVG icons or text alternatives instead. (STD-DOC-003 section 4.1)",
        },
      },
      create(context) {
        const emojiPattern =
          /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2702}-\u{27B0}]/u;

        return {
          Literal(node) {
            if (typeof node.value === "string" && emojiPattern.test(node.value)) {
              context.report({ node, messageId: "emojiInLiteral" });
            }
          },
          TemplateLiteral(node) {
            for (const quasi of node.quasis) {
              if (
                quasi.value &&
                quasi.value.cooked &&
                emojiPattern.test(quasi.value.cooked)
              ) {
                context.report({ node, messageId: "emojiInTemplate" });
                break;
              }
            }
          },
          JSXText(node) {
            if (node.value && emojiPattern.test(node.value)) {
              context.report({ node, messageId: "emojiInJSX" });
            }
          },
        };
      },
    },

    // Rule 2: no-unicode-graphics
    // Context: Production code (.ts, .tsx, .js, .jsx)
    // Level: [C] Critical
    "no-unicode-graphics": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow Unicode graphic characters in production code (STD-DOC-003 section 4.1, level [C])",
          category: "Unicode Policy",
          recommended: true,
        },
        messages: {
          unicodeGraphicsInLiteral:
            "Unicode graphic characters are prohibited in production code [C]. Use SVG icons instead. (STD-DOC-003 section 4.1)",
          unicodeGraphicsInTemplate:
            "Unicode graphic characters are prohibited in template literals [C]. Use SVG icons instead. (STD-DOC-003 section 4.1)",
          unicodeGraphicsInJSX:
            "Unicode graphic characters are prohibited in JSX text [C]. Use SVG icons instead. (STD-DOC-003 section 4.1)",
        },
      },
      create(context) {
        const unicodeGraphicsPattern =
          /[\u{2500}-\u{257F}\u{2580}-\u{259F}\u{25A0}-\u{25FF}\u{2190}-\u{21FF}\u{2200}-\u{22FF}\u{2300}-\u{23FF}\u{2400}-\u{243F}\u{2440}-\u{244A}\u{25CC}\u{2800}-\u{28FF}\u{2B50}\u{2B55}\u{2934}\u{2935}]/u;

        return {
          Literal(node) {
            if (
              typeof node.value === "string" &&
              unicodeGraphicsPattern.test(node.value)
            ) {
              context.report({ node, messageId: "unicodeGraphicsInLiteral" });
            }
          },
          TemplateLiteral(node) {
            for (const quasi of node.quasis) {
              if (
                quasi.value &&
                quasi.value.cooked &&
                unicodeGraphicsPattern.test(quasi.value.cooked)
              ) {
                context.report({ node, messageId: "unicodeGraphicsInTemplate" });
                break;
              }
            }
          },
          JSXText(node) {
            if (node.value && unicodeGraphicsPattern.test(node.value)) {
              context.report({ node, messageId: "unicodeGraphicsInJSX" });
            }
          },
        };
      },
    },

    // Rule 3: no-emoji-in-md
    // Context: Markdown files (.md)
    // Level: [W] Warning
    "no-emoji-in-md": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Disallow emoji in Markdown documentation (STD-DOC-003 section 4.1, level [W])",
          category: "Unicode Policy",
          recommended: true,
        },
        messages: {
          emojiInMd:
            "Emoji are prohibited in documentation [W]. Use text tags like [OK], [FAIL] instead. (STD-DOC-003 section 4.1)",
        },
      },
      create(context) {
        const emojiPattern =
          /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2702}-\u{27B0}]/u;

        return {
          Program(node) {
            const sourceCode =
              context.sourceCode || context.getSourceCode();
            const text = sourceCode.getText();

            const textWithoutCodeBlocks = text.replace(
              /```[\s\S]*?```/g,
              ""
            );

            const lines = textWithoutCodeBlocks.split("\n");
            lines.forEach((line, index) => {
              if (emojiPattern.test(line)) {
                context.report({
                  loc: { line: index + 1, column: 0 },
                  messageId: "emojiInMd",
                });
              }
            });
          },
        };
      },
    },

    // Rule 4: no-unicode-graphics-in-md
    // Context: Markdown files (.md)
    // Level: [W] Warning
    "no-unicode-graphics-in-md": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Disallow Unicode graphic characters in Markdown documentation (STD-DOC-003 section 4.1, level [W])",
          category: "Unicode Policy",
          recommended: true,
        },
        messages: {
          unicodeGraphicsInMd:
            "Unicode graphic characters are prohibited in documentation [W]. Use ASCII art in code blocks or text alternatives. (STD-DOC-003 section 4.1)",
        },
      },
      create(context) {
        const unicodeGraphicsPattern =
          /[\u{2500}-\u{257F}\u{2580}-\u{259F}\u{25A0}-\u{25FF}\u{2190}-\u{21FF}\u{2200}-\u{22FF}\u{2300}-\u{23FF}]/u;

        return {
          Program(node) {
            const sourceCode =
              context.sourceCode || context.getSourceCode();
            const text = sourceCode.getText();

            const textWithoutCodeBlocks = text.replace(
              /```[\s\S]*?```/g,
              ""
            );

            const lines = textWithoutCodeBlocks.split("\n");
            lines.forEach((line, index) => {
              if (unicodeGraphicsPattern.test(line)) {
                context.report({
                  loc: { line: index + 1, column: 0 },
                  messageId: "unicodeGraphicsInMd",
                });
              }
            });
          },
        };
      },
    },
  },
};
