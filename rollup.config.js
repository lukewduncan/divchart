import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import babel from '@rollup/plugin-babel';

export default [
  {
    input: 'src/index.js',
    output: [
      {
        file: 'dist/divchart.js',
        format: 'umd',
        name: 'DivChart',
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM'
        }
      },
      {
        file: 'dist/divchart.min.js',
        format: 'umd',
        name: 'DivChart',
        plugins: [terser()],
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM'
        }
      },
      {
        file: 'dist/divchart.esm.js',
        format: 'es'
      }
    ],
    external: ['react', 'react-dom'],
    plugins: [
      nodeResolve({
        extensions: ['.js', '.jsx']  // Add this line
      }),
      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env', '@babel/preset-react'],
        extensions: ['.js', '.jsx']
      })
    ]
  }
];
