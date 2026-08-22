import fs from 'node:fs';
import path from 'node:path';

const baseDir = path.resolve('research-data');
const targetDataset = process.argv[2];
const datasets = targetDataset ? [targetDataset] : ['evolution', 'veridark', 'nict-darknet-2022', 'darknet-surfing'];

console.log('============================================================');
console.log('WOLVERINE INTELLIGENCE — RESEARCH DATASET PROFILER');
console.log('============================================================\n');

for (const ds of datasets) {
  const dsDir = path.join(baseDir, ds);
  const fixturesDir = path.join(dsDir, 'fixtures');
  if (!fs.existsSync(fixturesDir)) continue;

  const fixtureFiles = fs.readdirSync(fixturesDir).filter((f) => f.endsWith('.json'));

  for (const file of fixtureFiles) {
    const fullPath = path.join(fixturesDir, file);
    const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

    if (!Array.isArray(content) || content.length === 0) continue;

    const rowCount = content.length;
    const fieldCounts: Record<string, number> = {};
    const fieldTypes: Record<string, Set<string>> = {};
    const textLengths: number[] = [];
    const timestamps: string[] = [];

    for (const row of content) {
      for (const [k, v] of Object.entries(row)) {
        fieldCounts[k] = (fieldCounts[k] || 0) + 1;
        if (!fieldTypes[k]) fieldTypes[k] = new Set();
        fieldTypes[k].add(typeof v);

        if (typeof v === 'string') {
          if (k.toLowerCase().includes('text') || k.toLowerCase().includes('desc') || k.toLowerCase().includes('title')) {
            textLengths.push(v.length);
          }
          if (k.toLowerCase().includes('time') || k.toLowerCase().includes('date')) {
            timestamps.push(v);
          }
        }
      }
    }

    const fieldSummary: Record<string, any> = {};
    for (const [k, count] of Object.entries(fieldCounts)) {
      fieldSummary[k] = {
        presentCount: count,
        nullRate: ((rowCount - count) / rowCount).toFixed(4),
        types: Array.from(fieldTypes[k] || []),
      };
    }

    textLengths.sort((a, b) => a - b);
    const minTextLen = textLengths.length ? textLengths[0] : 0;
    const maxTextLen = textLengths.length ? textLengths[textLengths.length - 1] : 0;
    const avgTextLen = textLengths.length ? (textLengths.reduce((a, b) => a + b, 0) / textLengths.length).toFixed(1) : 0;

    const profileReport = {
      dataset: ds,
      fixtureFile: file,
      profiledAt: new Date().toISOString(),
      rowCount,
      fields: fieldSummary,
      textMetrics: {
        minCharacters: minTextLen,
        maxCharacters: maxTextLen,
        avgCharacters: avgTextLen,
      },
      temporalMetrics: {
        firstTimestamp: timestamps.sort()[0] || null,
        lastTimestamp: timestamps.sort()[timestamps.length - 1] || null,
      },
    };

    const outPath = path.join(dsDir, 'reports', `${file.replace('.json', '')}.profile.json`);
    fs.writeFileSync(outPath, JSON.stringify(profileReport, null, 2) + '\n', 'utf8');

    console.log(`• Profiled [${ds}/${file}]:`);
    console.log(`  Records    : ${rowCount}`);
    console.log(`  Fields     : ${Object.keys(fieldSummary).join(', ')}`);
    console.log(`  Text Length: avg ${avgTextLen} chars (min: ${minTextLen}, max: ${maxTextLen})`);
    console.log(`  Report Saved: ${path.relative(process.cwd(), outPath)}\n`);
  }
}

console.log('============================================================');
console.log('PROFILING COMPLETE: All dataset profiles generated.');
console.log('============================================================');
