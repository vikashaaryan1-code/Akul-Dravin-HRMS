const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

if (!code.includes('pathname.startsWith(\'/api/v1/\')')) {
  code = code.replace(
    'const pathname = requestUrl.pathname;',
    `let pathname = requestUrl.pathname;
  if (pathname.startsWith('/api/v1/')) {
    pathname = '/api/' + pathname.slice(8);
  }`
  );
  fs.writeFileSync('server.js', code, 'utf8');
  console.log('Successfully patched pathname for /api/v1/');
} else {
  console.log('Pathname patch already exists.');
}
