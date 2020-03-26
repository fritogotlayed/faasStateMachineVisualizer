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

const handle = async (argv) => {
  const { input } = argv;

  const body = await readFile(input, 'utf-8');
  const flow = JSON.parse(body);
  const lines = lib.generateMermaidLines(flow);
  await writeMermaidFile(lines, argv);
};

exports.command = 'to-mermaid <input>';
exports.desc = 'Parses the input state machine and generates the output mermaid file';
exports.builder = {
  output: {
    default: null,
    desc: 'Optional output file name',
  },
};
exports.handler = (argv) => handle(argv);
