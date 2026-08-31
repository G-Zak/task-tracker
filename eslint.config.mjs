import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const noPrismaClientInClientComponents = {
  rules: {
    "no-value-import": {
      meta: { type: "problem" },
      create(context) {
        let isClientComponent = false
        return {
          Program(node) {
            isClientComponent = node.body.some(
              (stmt) =>
                stmt.type === "ExpressionStatement" &&
                stmt.expression.type === "Literal" &&
                stmt.expression.value === "use client"
            )
          },
          ImportDeclaration(node) {
            if (!isClientComponent) return
            if (node.importKind === "type") return
            const source = node.source.value
            if (typeof source === "string" && /generated\/client$/.test(source)) {
              context.report({
                node,
                message:
                  "N'importez pas de valeurs depuis '@/generated/client' (client Prisma complet, Node-only) dans un Client Component — utilisez '@/generated/enums' pour les enums, ou `import type` si l'usage est uniquement un type.",
              })
            }
          },
        }
      },
    },
  },
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { "local-prisma-boundary": noPrismaClientInClientComponents },
    rules: { "local-prisma-boundary/no-value-import": "error" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
