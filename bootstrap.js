const fs = require('fs');
const path = require('path');

/**
 * nightcomic frontend bootstrap.
 *
 * Railway serves the `public/` directory from server.js.  The original project
 * embedded an older frontend in base64 and only created public files when they
 * were missing, which meant new root-level HTML/CSS/JS changes could be
 * ignored forever.  We intentionally mirror the canonical root frontend into
 * public on every startup so the deployed site always runs the committed files.
 */
module.exports = function ensureFrontend() {
  const root = __dirname;
  const mappings = {
    'index.html': 'public/index.html',
    'detail.html': 'public/detail.html',
    'reader.html': 'public/reader.html',
    'login.html': 'public/login.html',
    '404.html': 'public/404.html',
    'style.css': 'public/css/style.css',
    'detail.css': 'public/css/detail.css',
    'reader.css': 'public/css/reader.css',
    'app.js': 'public/js/app.js',
    'detail.js': 'public/js/detail.js',
    'reader.js': 'public/js/reader.js',
    'robots.txt': 'public/robots.txt',
    'sitemap.xml': 'public/sitemap.xml',
    'nightcomic-hero.svg': 'public/assets/nightcomic-hero.svg',
    'nightcomic-logo.png': 'public/assets/nightcomic-logo.png'
  };

  for (const [sourceRel, destRel] of Object.entries(mappings)) {
    const source = path.join(root, sourceRel);
    const dest = path.join(root, destRel);
    if (!fs.existsSync(source)) continue;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(source, dest);
  }
};
