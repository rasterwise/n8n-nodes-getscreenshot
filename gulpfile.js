const { src, dest } = require('gulp');

// Copies the files tsc does not emit: node icons and the codex metadata
// (*.node.json), which n8n reads from next to the compiled node file.
function buildIcons() {
  return src(['nodes/**/*.svg', 'nodes/**/*.node.json']).pipe(dest('dist/nodes'));
}

exports['build:icons'] = buildIcons;
