const fs = require('fs');
const path = require('path');
const util = require('util');
const puppeteer = require('puppeteer');
const lib = require('../lib');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const unlinkFile = util.promisify(fs.unlink);
const SITE_PATH = path.join(__dirname, '..', '..', 'site');

const generateOutputFileName = (input, suffix) => {
  let name = '';
  const pathParts = input.split('/');
  const parts = pathParts[pathParts.length - 1].split('.');
  const stopper = parts.length - 1;
  for (let i = 0; i < stopper; i += 1) {
    name += `${parts[i]}.`;
  }
  name += suffix || 'png';
  return name;
};

const writeImageFile = async (lines, argv) => {
  let out = argv.output;
  if (!out) {
    out = generateOutputFileName(argv.input, 'png');
  }

  const template = await readFile(path.join(__dirname, '..', '..', 'site', 'index.html.template'), 'utf-8');
  const newIndex = (await template).replace('{{CONTENT}}', lines.join('\n'));
  await writeFile(path.join(SITE_PATH, 'index.html'), newIndex);

  process.stdout.write('Setting up to generate image...\n');
  const browser = await puppeteer.launch({ headless: true });
  const pages = await browser.pages();
  const page = pages[0];
  try {
    process.stdout.write('Saving image...\n');
    await page.goto(`file://${path.join(SITE_PATH, 'index.html')}`);

    const clip = await page.$eval('svg', (svg) => {
      const rect = svg.getBoundingClientRect();
      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      };
    });

    await page.screenshot({
      path: path.join(process.cwd(), out),
      clip,
      omitBackground: argv.transparent,
    });
  } finally {
    await browser.close();
    try {
      await unlinkFile(path.join(SITE_PATH, 'index.html'));
    } catch (e) {
      // NOTE: We don't care if we can't unlink the file. This should
      // not cause a failure in cleanup.
    }
  }
};

const handle = async (argv) => {
  const { input } = argv;

  const body = await readFile(input, 'utf-8');
  const flow = JSON.parse(body);
  const lines = lib.generateMermaidLines(flow);
  await writeImageFile(lines, argv);
};

exports.command = 'to-image <input>';
exports.desc = 'Parses the input state machine and generates the output mermaid file';
exports.builder = {
  output: {
    default: null,
    desc: 'Optional output file name',
  },
  transparent: {
    default: false,
    type: 'boolean',
    desc: 'Render the image with a transparent background or not',
  },
};
exports.handler = (argv) => handle(argv);
