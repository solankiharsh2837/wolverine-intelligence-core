import fs from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';
import crypto from 'node:crypto';

async function getFirstLines(filePath: string, n: number = 5): Promise<string[]> {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  const lines: string[] = [];
  for await (const line of rl) {
    lines.push(line);
    if (lines.length >= n) break;
  }
  return lines;
}

function computeSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

async function run() {
  const extracted = path.resolve('wolverine-intelligence/research-data/evolution/extracted');

  const files = [
    'market/categories.tsv',
    'market/vendors.tsv',
    'market/listings.tsv',
    'forum/user.tsv',
    'network/nodes.tsv',
    'network/edges-2014-1.tsv'
  ];

  for (const f of files) {
    const p = path.join(extracted, f);
    if (fs.existsSync(p)) {
      const lines = await getFirstLines(p, 4);
      console.log(`=== ${f} ===`);
      console.log('Header:', lines[0]);
      console.log('Row 1 :', lines[1]);
      console.log('Row 2 :', lines[2]);
      console.log('');
    }
  }
}

run();
