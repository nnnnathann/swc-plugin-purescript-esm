/**
 @typedef {import('@swc/core').AssignmentExpression} AssignmentExpression;
 @typedef {import('@swc/core').Identifier} Identifier;
 @typedef {import('@swc/core').KeyValueProperty} KeyValueProperty;
 @typedef {import('@swc/core').MemberExpression} MemberExpression;
 @typedef {import('@swc/core').ExpressionStatement} ExpressionStatement;
 @typedef {import('@swc/core').ModuleItem} ModuleItem;
 @typedef {import('@swc/core').ObjectExpression} ObjectExpression;
 @typedef {import('@swc/core').ModuleDeclaration} ModuleDeclaration;
 @typedef {import('@swc/core').ExportNamedDeclaration} ExportNamedDeclaration;
 @typedef {import('@swc/core').Statement} Statement;
 @typedef {import('@swc/core').Expression} Expression;
 @typedef {import('@swc/core').PropertyName} PropertyName;
**/
import { Visitor } from "@swc/core/Visitor.js";
import { createSpan, createIdentifier, createStringLiteral } from "./create.js";
import { randomId } from "./randomId.js";

export class ReplaceModuleExports extends Visitor {
    /**
     *
     * @param {ModuleItem[]} items
     * @returns {ModuleItem[]}
     */
    visitModuleItems(items) {
        return items.flatMap(this.visitModuleItemSpread);
    }
    /**
     *
     * @param {ModuleItem} item
     * @returns {ModuleItem[]}
     */
    visitModuleItemSpread = (item) => {
        if (!isModuleExports(item)) {
            return [this.visitModuleItem(item)];
        }
        return [
            ...getSpecifiers(item.expression.right.properties),
            ...getAllAsExportDefault(item.expression.right.properties),
        ];
    };
}
/**
 * returns a seqence of statements
 * corresponding to a module.exports block, given
 * the key-value right hand side of a module.exports,
 * for example:
 *
 * module.exports = { hello: "world", foo: foo };
 *
 * turns into something like
 *
 * export { foo }
 * var hello_121209 = "world";
 * export { hello_121209 as hello };
 * @param {KeyValueProperty[]} props
 * @returns {(ModuleDeclaration | Statement)[]}
 */
function getSpecifiers(props) {
    return props.flatMap((prop) => {
        if (isPunnable(prop)) {
            return [createExportPun(prop.key.value)];
        }
        const exportedName = getName(prop.key);
        if (exportedName === null) {
            console.warn("unable to export computed name: ", prop);
            return [];
        }
        return createAliasedExport(exportedName, prop.value);
    });
}

/**
 *
 * @param {PropertyName} key
 * @returns {string | number | null}
 */
function getName(key) {
    if (key.type === "Computed") {
        return null;
    }
    return key.value;
}

/**
 * @param {KeyValueProperty[]} props
 */
function getAllAsExportDefault(props) {
    return [
        {
            type: "VariableDeclaration",
            span: createSpan(),
            kind: "const",
            declare: false,
            declarations: [
                {
                    type: "VariableDeclarator",
                    span: createSpan(),
                    id: {
                        type: "Identifier",
                        span: createSpan(),
                        value: "$$default",
                        optional: false,
                        typeAnnotation: null,
                    },
                    init: {
                        type: "ObjectExpression",
                        span: createSpan(),
                        properties: props,
                    },
                    definite: false,
                },
            ],
        },
        {
            type: "ExportDefaultExpression",
            span: createSpan(),
            expression: {
                type: "Identifier",
                span: createSpan(),
                value: "$$default",
                optional: false,
            },
        },
    ];
}

/**
 *
 * @param {string} name
 * @returns {ExportNamedDeclaration & { typeOnly: boolean }}
 */
function createExportPun(name) {
    return {
        type: "ExportNamedDeclaration",
        span: createSpan(),
        specifiers: [
            {
                type: "ExportSpecifier",
                span: createSpan(),
                orig: createIdentifier(name),
                exported: null,
            },
        ],
        typeOnly: false,
    };
}

/**
 *
 * @param {string|number} exportedName
 * @param {Expression} value
 * @returns {(ModuleDeclaration | Statement)[]}
 */
function createAliasedExport(exportedName, value) {
    const tmpVarName = `${exportedName}_${randomId()}`.replace(/[^\w_]/gi, "");
    return [
        {
            type: "VariableDeclaration",
            span: createSpan(),
            kind: "const",
            declare: false,
            declarations: [
                {
                    type: "VariableDeclarator",
                    span: createSpan(),
                    id: createIdentifier(tmpVarName),
                    init: value,
                    definite: true,
                },
            ],
        },
        {
            type: "ExportNamedDeclaration",
            span: createSpan(),
            specifiers: [
                {
                    type: "ExportSpecifier",
                    span: createSpan(),
                    orig: createIdentifier(tmpVarName),
                    exported: createStringLiteral(exportedName),
                    isTypeOnly: false,
                },
            ],
            source: null,
            typeOnly: false,
            asserts: null,
        },
    ];
}
/**
 *
 * @param {KeyValueProperty} prop
 * @returns {boolean}
 */
function isPunnable(prop) {
    return (
        prop.key.type === "Identifier" &&
        prop.value.type === "Identifier" &&
        prop.key.value === prop.value.value
    );
}
/**
 *
 * @param {ModuleItem} e
 * @returns {boolean}
 */
function isModuleExports(e) {
    if (e.type !== "ExpressionStatement") {
        return false;
    }
    if (e.expression.type !== "AssignmentExpression") {
        return false;
    }
    if (e.expression.left.type !== "MemberExpression") {
        return false;
    }
    if (e.expression.left.object.type !== "Identifier") {
        return false;
    }
    if (e.expression.left.object.value !== "module") {
        return false;
    }
    if (e.expression.left.property.type !== "Identifier") {
        return false;
    }
    if (e.expression.left.property.value !== "exports") {
        return false;
    }
    if (e.expression.right.type !== "ObjectExpression") {
        return false;
    }
    return true;
}
