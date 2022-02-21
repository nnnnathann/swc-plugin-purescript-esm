import { ReplaceModuleExports } from "./visitors/replace-module-exports.js";
import { CommonJSVisitor } from "./visitors/visitor-cjs.js";

export function plugin() {
    const replace = new ReplaceModuleExports();
    const cjs = new CommonJSVisitor();
    return (m) => {
        return [
            ...[replace.visitProgram.bind(replace), cjs.visitProgram.bind(cjs)],
        ].reduce((m, f) => f(m), m);
    };
}
