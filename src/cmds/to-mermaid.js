const fs = require('fs');
const path = require('path');
const util = require('util');
const lib = require('../lib');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const fsExists = util.promisify(fs.exists);
const mkDir = util.promisify(fs.mkdir);


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

const generateSubDocStubs = async (flow, argv) => {
  let out = argv.output;
  if (!out) {
    out = generateOutputFileName(argv.input);
  }

  const outParts = out.split('.');
  const outDir = path.basename(out, `.${outParts[outParts.length - 1]}`);

  const dirExists = await fsExists(outDir);
  if (!dirExists) {
    await mkDir(outDir);
  }

  const stateKeys = Object.keys(flow.States);
  return Promise.all(
    stateKeys.map(async (key) => {
      const state = flow.States[key];
      if (state.Type === 'Task') {
        const fileName = `${key}.sequence.mmd`;
        const filePath = path.join(outDir, fileName); const fileExists = await fsExists(filePath);
        return fileExists ? Promise.resolve() : writeFile(filePath, '');
      }
      return Promise.resolve();
    }),
  );
};

const handle = async (argv) => {
  const { input, stubSubDocs } = argv;

  const body = await readFile(input, 'utf-8');
  const flow = JSON.parse(body);
  const lines = lib.generateMermaidLines(flow);
  await writeMermaidFile(lines, argv);
  if (stubSubDocs) {
    await generateSubDocStubs(flow, argv);
  }
};

exports.command = 'to-mermaid <input>';
exports.desc = 'Parses the input state machine and generates the output mermaid file';
exports.builder = {
  output: {
    default: null,
    desc: 'Optional output file name',
  },
  stubSubDocs: {
    default: false,
    type: 'boolean',
    desc: 'When enabled a directory is created with stub documents created for each task',
  },
};
exports.handler = (argv) => handle(argv);
