import { ReplaceModuleExports } from "./visitors/replace-module-exports";
import { CommonJSVisitor } from "./visitors/visitor-cjs";

export function plugin() {
    const replace = new ReplaceModuleExports();
    const cjs = new CommonJSVisitor();
    return (m) => {
        return [
            // ...(logging ? [log.visitProgram.bind(log)] : []),
            ...[replace.visitProgram.bind(replace), cjs.visitProgram.bind(cjs)],
        ].reduce((m, f) => f(m), m);
    };
}
