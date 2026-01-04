import traverse, { type NodePath } from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import template from '@babel/template';
import type { parseScript, Macro, SignalMacro, ComputedMacro, EffectMacro } from './script-parser';

const signalTemplate = template.statement(`const NAME = createSignal(VALUE);`);
const computedTemplate = template.statement(`const NAME = computed(() => VALUE);`);
const effectTemplate = template.statement(`createEffect(EFFECT_FN, DEPS);`);

export function compileScript(
  scriptAst: t.File,
  macros: ReturnType<typeof parseScript>['macros']
): string {
  const reactiveVarNames = new Set<string>(
    macros
      .filter((m): m is SignalMacro | ComputedMacro => m.type === 'signal' || m.type === 'computed')
      .map(m => m.name)
  );

  // First pass: transform macros.
  traverse(scriptAst, {
    LabeledStatement(path: NodePath<t.LabeledStatement>) {
      const macro = macros.find(
        (m): m is SignalMacro | ComputedMacro =>
          (m.type === 'signal' || m.type === 'computed') &&
          t.isExpressionStatement(path.node.body) &&
          t.isAssignmentExpression(path.node.body.expression) &&
          t.isIdentifier(path.node.body.expression.left) &&
          m.name === path.node.body.expression.left.name
      );
      if (macro) {
        if (macro.type === 'signal') {
          path.replaceWith(signalTemplate({ NAME: t.identifier(macro.name), VALUE: macro.value }));
        } else {
          path.replaceWith(computedTemplate({ NAME: t.identifier(macro.name), VALUE: macro.value }));
        }
      }
    },
    ExpressionStatement(path: NodePath<t.ExpressionStatement>) {
      const expression = path.node.expression;
      if (t.isCallExpression(expression) && t.isIdentifier(expression.callee) && expression.callee.name === 'effect') {
        const effectMacro = macros.find(
          (m): m is EffectMacro => m.type === 'effect' && m.effectFn.start === expression.arguments[0]?.start
        );
        if (effectMacro) {
          path.replaceWith(effectTemplate({ EFFECT_FN: effectMacro.effectFn, DEPS: effectMacro.deps ?? t.arrayExpression([]) }));
        }
      }
    },
  });

  // Second pass: handle signal unwrapping with scope analysis.
  traverse(scriptAst, {
    Identifier(path: NodePath<t.Identifier>) {
      const name = path.node.name;
      if (!reactiveVarNames.has(name)) return;

      // Check if this identifier is shadowed by a local binding (e.g., a function parameter).
      const binding = path.scope.getBinding(name);
      const topLevelBinding = path.scope.getProgramParent().getBinding(name);
      if (binding !== topLevelBinding) {
        return;
      }

      // Check context to avoid transforming declarations, keys, or function calls.
      const { parentPath } = path;
      if (
        (parentPath.isVariableDeclarator() && path.key === 'id') ||
        (parentPath.isFunction() && parentPath.node.params.includes(path.node)) ||
        (parentPath.isObjectProperty() && path.key === 'key') ||
        (parentPath.isMemberExpression() && path.key === 'property') ||
        (parentPath.isCallExpression() && path.key === 'callee') ||
        (parentPath.isAssignmentExpression() && path.key === 'left')
      ) {
        return;
      }

      path.replaceWith(t.callExpression(path.node, []));
    },
    AssignmentExpression(path: NodePath<t.AssignmentExpression>) {
      if (t.isIdentifier(path.node.left) && reactiveVarNames.has(path.node.left.name)) {
        const binding = path.scope.getBinding(path.node.left.name);
        const topLevelBinding = path.scope.getProgramParent().getBinding(path.node.left.name);
        if (binding === topLevelBinding) {
          path.replaceWith(t.callExpression(path.node.left, [path.node.right]));
        }
      }
    },
  });

  const { code } = generate(scriptAst);
  return code;
}
