import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Un import "valeur" de '@/generated/client' (client Prisma complet, Node-only) dans un Client
// Component casse le bundling Turbopack ("chunking context does not support external modules") —
// rencontré une fois en cours de projet (US-039, UserRow.tsx), silencieusement, sans que `tsc` ni
// une exécution normale d'eslint sans cette règle ne le signalent. `import type {...}` reste
// autorisé : erasé à la compilation, jamais réellement bundlé. Voir
// documentation (gitignored) pour le détail de l'incident.
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
