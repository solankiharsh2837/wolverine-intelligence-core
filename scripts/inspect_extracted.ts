import fs from 'node:fs';
import path from 'node:path';

const extracted = path.resolve('wolverine-intelligence/research-data/evolution/extracted');

const files = [
  'market/listings.tsv',
  'market/vendors.tsv',
  'market/categories.tsv',
  'forum/post.tsv',
  'forum/user.tsv',
  'network/nodes.tsv',
  'network/edges-2014-1.tsv'
];

for (const f of files) {
  const p = path.join(extracted, f);
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, 'utf8').split('\n').filter(Boolean);
    console.log(`=== ${f} === (Total rows: ${lines.length})`);
    console.log('Header:', lines[0]);
    console.log('Row 1 :', lines[1]);
    console.log('');
  }
}
