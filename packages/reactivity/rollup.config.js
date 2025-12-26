import typescript from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';

const packageName = 'ld-reactivity';

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: `dist/${packageName}.esm.js`,
        format: 'es',
        sourcemap: true,
      },
      {
        file: `dist/${packageName}.cjs.js`,
        format: 'cjs',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      file: `dist/types/index.d.ts`,
      format: 'es',
    },
    plugins: [dts()],
  },
];
