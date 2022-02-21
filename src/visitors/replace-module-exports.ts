import {
    AssignmentExpression,
    Identifier,
    KeyValueProperty,
    MemberExpression,
    ExpressionStatement,
    ModuleItem,
    ObjectExpression,
    ModuleDeclaration,
    ExportNamedDeclaration,
    Statement,
    Expression,
    PropertyName,
} from "@swc/core";
import { Visitor } from "@swc/core/Visitor.js";
import { createSpan, createIdentifier } from "./create";
import { randomId } from "./randomId";

export class ReplaceModuleExports extends Visitor {
    visitModuleItems(items: ModuleItem[]): ModuleItem[] {
        return items.flatMap(this.visitModuleItemSpread);
    }
    visitModuleItemSpread = (item: ModuleItem): ModuleItem[] => {
        if (!isModuleExports(item)) {
            return [this.visitModuleItem(item)];
        }
        return getSpecifiers(item.expression.right.properties);
    };
}

function getSpecifiers(
    props: KeyValueProperty[]
): (ModuleDeclaration | Statement)[] {
    return props.flatMap((prop): (ModuleDeclaration | Statement)[] => {
        if (isPunnable(prop)) {
            return [createExportPun((prop.key as Identifier).value)];
        }
        const exportedName = getName(prop.key);
        if (exportedName === null) {
            console.warn("unable to export computed name: ", prop);
            return [];
        }
        return createAliasedExport(exportedName, prop.value);
    });
}

function getName(key: PropertyName): string | number | null {
    if (key.type === "Computed") {
        return null;
    }
    return key.value;
}

function createExportPun(
    name: string
): ExportNamedDeclaration & { typeOnly: boolean } {
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

function createAliasedExport(
    exportedName: string | number,
    value: Expression
): (ModuleDeclaration | Statement)[] {
    const tmpVarName = `${exportedName}_${randomId()}`;
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
                    id: createIdentifier(exportedName),
                    init: value,
                    definite: true,
                },
            ],
        },
        {
            type: "ExportNamedDeclaration",
            span: { start: 23, end: 51, ctxt: 0 },
            specifiers: [
                {
                    type: "ExportSpecifier",
                    span: createSpan(),
                    orig: createIdentifier(tmpVarName),
                    exported: createIdentifier(exportedName),
                    isTypeOnly: false,
                },
            ],
            source: null,
            typeOnly: false,
            asserts: null,
        },
    ];
}

function isMappable(prop: KeyValueProperty): prop is Mappable {
    if (prop.key.type !== "Identifier") {
        return false;
    }
    if (prop.key.value === "default") {
        return true;
    }
    return true;
}

function isPunnable(prop: KeyValueProperty) {
    return (
        prop.key.type === "Identifier" &&
        prop.value.type === "Identifier" &&
        prop.key.value === prop.value.value
    );
}

interface Mappable extends KeyValueProperty {
    key: Identifier;
}
interface ModuleExports extends ExpressionStatement {
    expression: ModuleExportsAssignmentExpression;
}
interface ModuleExportsAssignmentExpression extends AssignmentExpression {
    left: MemberExpression;
    right: PSObjectExpression;
}
interface PSObjectExpression extends ObjectExpression {
    properties: PSObjectProperty[];
}
interface PSObjectProperty extends KeyValueProperty {}

function isModuleExports(e: ModuleItem): e is ModuleExports {
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
