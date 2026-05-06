const esbuild = require('esbuild');

module.exports = {
  process(sourceText, sourcePath) {
    const result = esbuild.transformSync(sourceText, {
      loader: sourcePath.endsWith('.jsx') ? 'jsx' : 'js',
      format: 'cjs',
      jsx: 'automatic',
      sourcemap: 'inline',
    });

    return { code: result.code };
  },
};
