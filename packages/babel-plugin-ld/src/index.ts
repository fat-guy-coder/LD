import { declare } from '@babel/helper-plugin-utils';
import { type NodePath, type ConfigAPI } from '@babel/core';
import * as t from '@babel/types';

export default declare((api: ConfigAPI) => {
  api.assertVersion(7);

  const visitor = {
    JSXElement(_path: NodePath<t.JSXElement>) {
      // TODO: Implement the transformation logic from JSX to `h` function calls.
    },
    JSXFragment(_path: NodePath<t.JSXFragment>) {
      // TODO: Implement the transformation for JSX Fragments.
    },
  };

  return {
    name: 'babel-plugin-ld',
    visitor,
    inherits: require('@babel/plugin-syntax-jsx').default,
  };
});
