const fs = require('fs');
const util = require('util');
const lib = require('../lib');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);


const generateOutputFileName = (input, suffix) => {
  let name = '';
  const pathParts = input.split('/');
  const parts = pathParts[pathParts.length - 1].split('.');
  const stopper = parts.length - 1;
  for (let i = 0; i < stopper; i += 1) {
    name += `${parts[i]}.`;
  }
  name += suffix || 'mmd';
  return name;
};

const writeMermaidFile = async (lines, argv) => {
  let out = argv.output;
  if (!out) {
    out = generateOutputFileName(argv.input);
  }

  await writeFile(out, lines.join('\n'));
  process.stdout.write(`Copy & paste your new mmd file (${out}) into https://mermaid-js.github.io/mermaid-live-editor/ to see your flow!\n`);
};

const pasteBodyIn = async (page, lines) => {
  /* eslint-disable global-require */
  /* eslint-disable import/no-extraneous-dependencies */
  const clipboardy = require('clipboardy');
  /* eslint-enable import/no-extraneous-dependencies */
  /* eslint-enable global-require */

  process.stdout.write('Generating image...\n');
  const oldClip = await clipboardy.read();
  await clipboardy.write(lines.join('\n'));
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyV');
  await page.keyboard.up('Control');
  await page.keyboard.press('Enter');
  await clipboardy.write(oldClip);
};

/**
 * 
 * @param {any} page
 * @param {string[]} lines
 */
const writeBodyIn = async (page, lines) => {
  const data = lines
    .map((v, i) => (i === 1 ? v : v.replace(INDENT, '')))
    .join('\n');
  process.stdout.write('Generating image');
  const handle = setInterval(() => {
    process.stdout.write('.');
  }, 1000);
  await page.keyboard.type(data);
  clearTimeout(handle);
  process.stdout.write('\n');
};

const writeImageFile = async (lines, argv) => {
  let out = argv.output;
  if (!out) {
    out = generateOutputFileName(argv.input, 'jpg');
  }

  /* eslint-disable global-require */
  /* eslint-disable import/no-extraneous-dependencies */
  const puppeteer = require('puppeteer');
  const utils = require('../utils');
  /* eslint-enable import/no-extraneous-dependencies */
  /* eslint-enable global-require */

  const rootMermaidUrl = 'https://mermaid-js.github.io';

  process.stdout.write('Setting up to generate image...\n');
  const browser = await puppeteer.launch({ headless: true, slowMo: 50 });
  const pages = await browser.pages();
  const page = pages[0];
  try {
    await page.goto(`${rootMermaidUrl}/mermaid-live-editor`);
    await page.click('#editor');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');

    switch (argv.mode.toLowerCase()) {
      case 'experimental':
        await pasteBodyIn(page, lines); // doesn't work in headless
        break;
      default:
        await writeBodyIn(page, lines); // works in headless
        break;
    }

    process.stdout.write('Saving image...\n');
    const downloadAnchor = await page.$('#links > a:nth-child(3)');
    const href = await page.evaluate((anchor) => anchor.getAttribute('href'), downloadAnchor);
    await utils.download(`${href}`, process.cwd(), out);
  } finally {
    await page.close();
    await browser.close();
  }
};

const handle = async (argv) => {
  const { input } = argv;

  const body = await readFile(input, 'utf-8');
  const flow = JSON.parse(body);
  const lines = lib.generateMermaidLines(flow);

  const outputType = argv.outputType.toUpperCase();
  switch (outputType) {
    case 'IMG':
      try {
        await writeImageFile(lines, argv);
      } catch (e) {
        process.stdout.write('Writing image file failed. This may be due to a missing dependency or another issue. Falling back to using the mermaid file.');
        await writeMermaidFile(lines, argv);
      }
      break;
    default:
      if (outputType !== 'MMD') {
        process.stdout.write(`${outputType} not understood. Defaulting to mermaid file output.`);
      }

      await writeMermaidFile(lines, argv);
      break;
  }
};

exports.command = 'to-image-safe <input>';
exports.desc = 'Parses the input state machine and generates the output mermaid file';
exports.builder = {
  output: {
    default: null,
    desc: 'Optional output file name',
  },
  outputType: {
    default: 'mmd',
    desc: 'Output format type. MMD - mermaid document, IMG - SVG format. Please note that using IMG format requires the optional dependency of puppeteer to be installed.',
  },
  mode: {
    default: 'safe',
    desc: 'Image generation method to use. "safe" or "experimental". WARNING: Experimental mode may generate the incorrect image.',
  },
};
exports.handler = (argv) => handle(argv);
