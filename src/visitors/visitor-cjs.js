const { Visitor } = require("@swc/core/Visitor");
const {
  createStringLiteralStatement,
  createExportAllDeclaration,
  createExportDefaultModuleDotExports,
  createImportDefaultExpression,
  createExportDefaultObjectExpression,
  createExportDeclaration,
  createSpan,
  createIdentifier,
  createAssignmentExpressionStatement,
  createVariableDeclaration,
} = require("./create");
const { randomId } = require('./randomId');

class CommonJSVisitor extends Visitor {
  _exportDeclarationNames = new Map();
  _exportDeclarations = new Map();
  _requireURLs = [];
  _requireNames = [];

  _hasModuleDotExports = false;
  _exportAllDeclarations = new Map();

  visitProgram(program) {
    return this.updatePoregramTree(super.visitProgram(program));
  }

  /**
   *
   * @param {import("@swc/core").CallExpression} expression
   * @returns {import("@swc/core").CallExpression}
   */
  visitCallExpression(expression) {
    const callee = expression.callee.value;

    if (callee === "require" && expression.arguments.length === 1) {
      const url = expression.arguments[0].expression.value;
      const index = this._requireURLs.indexOf(url);
      let name;

      if (index === -1) {
        name = url.split(/[\.\/\\-]/g).join("_") + randomId();
        this._requireURLs.push(url);
        this._requireNames.push(name);
      } else {
        name = this._requireNames[index];
      }

      return createIdentifier(name);
    }

    return expression;
  }

  /**
   *
   * @param {import("@swc/core").ExpressionStatement} statement
   * @returns {import("@swc/core").Statement}
   */
  visitExpressionStatement(statement) {
    const { expression } = statement;
    if (
      expression.type === "StringLiteral" &&
      expression.value === "use strict"
    ) {
      return {
        type: "EmptyStatement",
        span: statement.span,
      };
    }

    if (
      expression.type === "AssignmentExpression" &&
      expression.left &&
      expression.left.object &&
      expression.left.object.value === "module" &&
      expression.left.property &&
      expression.left.property.value === "exports"
    ) {
      if (
        expression.right.type === "CallExpression" &&
        expression.right.callee.value === "require"
      ) {
        const url = expression.right.arguments[0].expression.value;
        const placeholder = "ExportAllDeclaration_" + randomId();
        this._exportAllDeclarations.set(placeholder, url);

        return createExportAllDeclaration(url);
      } else {
        this._hasModuleDotExports = true;
      }
    }

    if (expression.right && expression.right.type === "CallExpression") {
      expression.right = this.visitCallExpression(expression.right);
    }

    if (
      expression.type === "AssignmentExpression" &&
      expression.left.object &&
      expression.left.object.value === "exports" &&
      expression.left.property
    ) {
      const exportName = expression.left.property.value;
      const placeholder = exportName + randomId();

      this._exportDeclarationNames.set(
        exportName,
        this._exportDeclarationNames.has(exportName)
          ? this._exportDeclarationNames.get(exportName) + 1
          : 1
      );

      this._exportDeclarations.set(placeholder, {
        name: exportName,
        init: expression.right,
      });

      return createStringLiteralStatement(placeholder);
    }

    return statement;
  }

  /**
   *
   * @param {import("@swc/core").Program} program
   * @returns {import("@swc/core").Program}
   */
  updatePoregramTree(program) {
    const imports = [];
    const variables = [];
    const exports = [];

    this._requireNames.forEach((name, i) => {
      imports.push(createImportDefaultExpression(name, this._requireURLs[i]));
    });

    if (this._hasModuleDotExports) {
      exports.push(createExportDefaultModuleDotExports()); // @revist
    } else if (this._exportDeclarationNames.size > 0) {
      exports.push(
        createExportDefaultObjectExpression(
          Array.from(this._exportDeclarationNames.keys())
        )
      );
    }

    const body = program.body.map((statement) => {
      const literal =
        statement.type === "ExpressionStatement" &&
        statement.expression &&
        statement.expression.type === "StringLiteral" &&
        statement.expression.value;

      if (literal !== false && this._exportDeclarations.has(literal)) {
        const { name, init } = this._exportDeclarations.get(literal);

        const count = this._exportDeclarationNames.get(name);

        if (count === 1) {
          return createExportDeclaration(name, init);
        } else {
          variables.push(createVariableDeclaration(name, null));
          exports.push(createExportDeclaration(name, null));
          return createAssignmentExpressionStatement(name, init);
        }
      }

      return statement;
    });

    program.body = imports.concat(variables, body, exports);

    return program;
  }
}

module.exports = { CommonJSVisitor, createSpan };
