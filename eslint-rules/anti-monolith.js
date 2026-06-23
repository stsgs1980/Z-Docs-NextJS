// eslint-rules/anti-monolith.js
// ZAI-ARCH-002 Anti-Monolith v1.0 — Automated enforcement
// Thresholds from SKILL.md: file 250 lines, component 200 lines, useState max 2
module.exports = {
  configs: {
    recommended: {
      plugins: ["anti-monolith"],
      rules: {
        "anti-monolith/max-file-lines": "error",
        "anti-monolith/max-component-lines": "warn",
        "anti-monolith/max-use-state": "warn",
        "anti-monolith/max-function-lines": "warn",
      },
    },
  },
  rules: {
    // Rule 1: max-file-lines
    // Context: All production files
    // Level: [C] Critical — file must not exceed 250 lines
    // Exception: config files (next.config, tailwind.config), auto-generated files
    "max-file-lines": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Enforce maximum file length of 250 lines (ZAI-ARCH-002, level [C])",
          category: "Anti-Monolith",
          recommended: true,
        },
        messages: {
          exceeded:
            "File exceeds {{max}} lines ({{actual}} lines) [C]. Decompose using 7-step strategy. (ZAI-ARCH-002)",
        },
        schema: [
          {
            type: "object",
            properties: {
              max: { type: "integer", minimum: 1 },
              exclude: { type: "array", items: { type: "string" } },
            },
            additionalProperties: false,
          },
        ],
      },
      create(context) {
        const options = context.options[0] || {};
        const max = options.max || 250;
        const excludePatterns = (options.exclude || []).map((p) =>
          new RegExp(p)
        );
        const filename = context.filename || context.getFilename();

        // Skip excluded files
        for (const pattern of excludePatterns) {
          if (pattern.test(filename)) return {};
        }

        return {
          Program(node) {
            const sourceCode =
              context.sourceCode || context.getSourceCode();
            const lines = sourceCode.getLines();
            const actual = lines.length;

            if (actual > max) {
              context.report({
                loc: { line: max + 1, column: 0 },
                messageId: "exceeded",
                data: { max, actual },
              });
            }
          },
        };
      },
    },

    // Rule 2: max-component-lines
    // Context: React function components
    // Level: [W] Warning — component must not exceed 200 lines
    "max-component-lines": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Enforce maximum React component length of 200 lines (ZAI-ARCH-002, level [W])",
          category: "Anti-Monolith",
          recommended: true,
        },
        messages: {
          exceeded:
            "Component '{{name}}' exceeds {{max}} lines ({{actual}} lines) [W]. Extract sub-components to sections/. (ZAI-ARCH-002)",
        },
        schema: [
          {
            type: "object",
            properties: {
              max: { type: "integer", minimum: 1 },
            },
            additionalProperties: false,
          },
        ],
      },
      create(context) {
        const max = (context.options[0] || {}).max || 200;

        function isComponent(node) {
          if (node.type !== "FunctionDeclaration" && node.type !== "FunctionExpression" && node.type !== "ArrowFunctionExpression") {
            return false;
          }
          const name =
            node.id?.name ||
            (node.parent?.type === "VariableDeclarator"
              ? node.parent.id?.name
              : null);
          if (!name) return false;
          // PascalCase heuristic: starts with uppercase
          return /^[A-Z]/.test(name);
        }

        function getComponentSize(node) {
          const start = node.body.loc?.start?.line || 0;
          const end = node.body.loc?.end?.line || 0;
          return end - start + 1;
        }

        function getComponentName(node) {
          return (
            node.id?.name ||
            (node.parent?.type === "VariableDeclarator"
              ? node.parent.id?.name
              : "Anonymous")
          );
        }

        return {
          ExportDefaultDeclaration(node) {
            if (
              node.declaration &&
              isComponent(node.declaration)
            ) {
              const size = getComponentSize(node.declaration);
              const name = getComponentName(node.declaration);
              if (size > max) {
                context.report({
                  loc: { line: node.declaration.loc.start.line, column: 0 },
                  messageId: "exceeded",
                  data: { name, max, actual: size },
                });
              }
            }
          },
          ExportNamedDeclaration(node) {
            if (node.declaration) {
              const decls =
                node.declaration.declarations || [node.declaration];
              for (const decl of decls) {
                const fn = decl.init || decl;
                if (isComponent(fn)) {
                  const size = getComponentSize(fn);
                  const name = getComponentName(fn);
                  if (size > max) {
                    context.report({
                      loc: { line: fn.loc.start.line, column: 0 },
                      messageId: "exceeded",
                      data: { name, max, actual: size },
                    });
                  }
                }
              }
            }
          },
        };
      },
    },

    // Rule 3: max-use-state
    // Context: React function components
    // Level: [W] Warning — max 2 useState per component, 3rd must be extracted to custom hook
    "max-use-state": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Enforce maximum 2 useState calls per component (ZAI-ARCH-002, level [W])",
          category: "Anti-Monolith",
          recommended: true,
        },
        messages: {
          exceeded:
            "Component '{{name}}' has {{actual}} useState calls (max {{max}}) [W]. Extract state to use[Feature] custom hook. (ZAI-ARCH-002)",
        },
        schema: [
          {
            type: "object",
            properties: {
              max: { type: "integer", minimum: 1 },
            },
            additionalProperties: false,
          },
        ],
      },
      create(context) {
        const max = (context.options[0] || {}).max || 2;
        let currentComponent = null;

        function isComponentNode(node) {
          if (node.type !== "FunctionDeclaration" && node.type !== "FunctionExpression" && node.type !== "ArrowFunctionExpression") {
            return false;
          }
          const name =
            node.id?.name ||
            (node.parent?.type === "VariableDeclarator"
              ? node.parent.id?.name
              : null);
          if (!name) return false;
          return /^[A-Z]/.test(name);
        }

        function getComponentName(node) {
          return (
            node.id?.name ||
            (node.parent?.type === "VariableDeclarator"
              ? node.parent.id?.name
              : "Anonymous")
          );
        }

        const functionTypes = ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"];
        const visitors = {};

        for (const fnType of functionTypes) {
          visitors[fnType] = (node) => {
            if (isComponentNode(node)) {
              currentComponent = { node, name: getComponentName(node), useStateCount: 0 };
            }
          };
          visitors[fnType + ":exit"] = (node) => {
            if (currentComponent && currentComponent.node === node) {
              if (currentComponent.useStateCount > max) {
                context.report({
                  loc: { line: node.loc.start.line, column: 0 },
                  messageId: "exceeded",
                  data: {
                    name: currentComponent.name,
                    max,
                    actual: currentComponent.useStateCount,
                  },
                });
              }
              currentComponent = null;
            }
          };
        }

        visitors.CallExpression = (node) => {
            if (
              currentComponent &&
              node.callee.type === "Identifier" &&
              node.callee.name === "useState"
            ) {
              currentComponent.useStateCount++;
            }
          };

        return visitors;
      },
    },

    // Rule 4: max-function-lines
    // Context: All functions
    // Level: [I] Info — single function must not exceed 50 lines
    "max-function-lines": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Enforce maximum function length of 50 lines (ZAI-ARCH-002, level [I])",
          category: "Anti-Monolith",
          recommended: true,
        },
        messages: {
          exceeded:
            "Function '{{name}}' exceeds {{max}} lines ({{actual}} lines) [I]. Consider extracting logic. (ZAI-ARCH-002)",
        },
        schema: [
          {
            type: "object",
            properties: {
              max: { type: "integer", minimum: 1 },
            },
            additionalProperties: false,
          },
        ],
      },
      create(context) {
        const max = (context.options[0] || {}).max || 50;

        function checkFunction(node, name) {
          if (!name || name === "anonymous") return;
          // Skip component functions (handled by max-component-lines)
          if (/^[A-Z]/.test(name)) return;

          const body = node.body;
          if (!body || !body.loc) return;
          const size = body.loc.end.line - body.loc.start.line + 1;

          if (size > max) {
            context.report({
              loc: { line: node.loc.start.line, column: 0 },
              messageId: "exceeded",
              data: { name, max, actual: size },
            });
          }
        }

        return {
          FunctionDeclaration(node) {
            checkFunction(node, node.id?.name || null);
          },
          FunctionExpression(node) {
            const name =
              node.id?.name ||
              (node.parent?.type === "VariableDeclarator"
                ? node.parent.id?.name
                : null);
            checkFunction(node, name);
          },
          ArrowFunctionExpression(node) {
            const name =
              node.parent?.type === "VariableDeclarator"
                ? node.parent.id?.name
                : null;
            checkFunction(node, name);
          },
        };
      },
    },
  },
};