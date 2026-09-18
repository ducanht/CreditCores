import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import parser from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default || traverseModule;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../src');

// Danh sách các biến toàn cục hợp lệ trong môi trường trình duyệt + React
const standardGlobals = new Set([
  'window', 'document', 'navigator', 'location', 'history', 'localStorage', 'sessionStorage',
  'console', 'alert', 'confirm', 'prompt',
  'Math', 'Number', 'String', 'Boolean', 'Array', 'Object', 'Date', 'RegExp', 'JSON', 'Promise',
  'Function', 'Symbol', 'Error', 'TypeError', 'RangeError', 'SyntaxError',
  'Map', 'Set', 'WeakMap', 'WeakSet', 'BigInt', 'Intl',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame',
  'encodeURI', 'encodeURIComponent', 'decodeURI', 'decodeURIComponent',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  'fetch', 'Headers', 'Request', 'Response', 'FormData', 'URL', 'URLSearchParams', 'Blob', 'File', 'FileReader',
  'crypto', 'Image', 'Audio', 'Event', 'CustomEvent', 'KeyboardEvent', 'MouseEvent',
  'MutationObserver', 'ResizeObserver', 'IntersectionObserver',
  'React', 'process', 'globalThis', 'self',
  'performance', 'AbortController', 'TextEncoder', 'TextDecoder'
]);

function getAllFiles(dir, exts = ['.js', '.jsx']) {
  let files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.includes(path.extname(item.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = getAllFiles(rootDir);
console.log(`Analyzing ${allFiles.length} files in ${rootDir}...`);

const issues = [];

for (const filePath of allFiles) {
  const code = fs.readFileSync(filePath, 'utf8');
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });
  } catch (err) {
    console.error(`Syntax error parsing ${filePath}:`, err.message);
    continue;
  }

  const relPath = path.relative(path.resolve(__dirname, '..'), filePath);

  traverse(ast, {
    ReferencedIdentifier(identPath) {
      const { name } = identPath.node;
      // Bỏ qua các thuộc tính object (e.g., obj.name, { name: val } hoặc JSX props)
      if (identPath.parentPath.isMemberExpression({ property: identPath.node }) && !identPath.parent.computed) {
        return;
      }
      if (identPath.parentPath.isObjectProperty({ key: identPath.node }) && !identPath.parent.computed) {
        return;
      }
      if (identPath.parentPath.isJSXAttribute()) {
        return;
      }

      // Kiểm tra xem biến có được khai báo trong scope không
      if (!identPath.scope.hasBinding(name)) {
        if (!standardGlobals.has(name)) {
          const loc = identPath.node.loc?.start;
          issues.push({
            file: relPath,
            line: loc?.line,
            col: loc?.column,
            name,
            context: identPath.parentPath.type
          });
        }
      }
    }
  });
}

console.log(`\n=== SCAN RESULT: Found ${issues.length} potential undefined references ===\n`);

const grouped = {};
for (const issue of issues) {
  if (!grouped[issue.name]) grouped[issue.name] = [];
  grouped[issue.name].push(issue);
}

for (const [name, occurrences] of Object.entries(grouped)) {
  console.log(`🔴 [Undefined: "${name}"] - ${occurrences.length} occurrence(s):`);
  for (const occ of occurrences.slice(0, 10)) {
    console.log(`   at ${occ.file}:${occ.line}:${occ.col} (inside ${occ.context})`);
  }
  if (occurrences.length > 10) {
    console.log(`   ... and ${occurrences.length - 10} more`);
  }
}
