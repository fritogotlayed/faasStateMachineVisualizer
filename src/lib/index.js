const INDENT = '    ';

/**
 * Converts the supplied flow object to a array if lines for the mermaid markdown file
 * @param {object} flow The state machine flow object. Typically a JSON.parse of the file.
 */
const generateMermaidLines = (flow) => {
  const lines = [];
  lines.push('graph TD');
  lines.push(`${INDENT}start([start]) --> ${flow.StartAt}`);

  const stateKeys = Object.keys(flow.States);
  for (let i = 0; i < stateKeys.length; i += 1) {
    const key = stateKeys[i];
    const state = flow.States[key];

    // next
    if (state.Next) {
      lines.push(`${INDENT}${key} --> ${state.Next}`);
    }

    // default for choice
    if (state.Default) {
      lines.push(`${INDENT}${key} --> ${state.Default}`);
    }

    // choices
    const choicesLength = state.Choices ? state.Choices.length : 0;
    for (let j = 0; j < choicesLength; j += 1) {
      lines.push(`${INDENT}${key} --> ${state.Choices[j].Next}`);
    }

    // catch
    const catchLength = state.Catch ? state.Catch.length : 0;
    for (let j = 0; j < catchLength; j += 1) {
      lines.push(`${INDENT}${key} --> ${state.Catch[j].Next}`);
    }

    if (['Fail', 'Succeed'].indexOf(state.Type) > -1) {
      lines.push(`${INDENT}${key}([${key}])`);
    }
  }

  return lines;
};

module.exports = {
  INDENT,
  generateMermaidLines,
};
