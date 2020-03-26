# faasStateMachineVisualizer
Command line tool for interfacing with various mds services and utilities

## Getting Started

### Development

* `npm link` -- sets up your terminal environment to be able to run `mds`
* `npm unlink` -- removes the link from your system

## Usage

### Manual Installation

*(You should add these instructions to your project's README)*

In **zsh**, you can write these:

```bash
echo '. <(./githubber --completion)' >> .zshrc
```

In **bash**, you should write:

```bash
./githubber --completion >> ~/githubber.completion.sh
echo 'source ~/githubber.completion.sh' >> .bash_profile
```

In **fish**, you can write:

```bash
echo 'githubber --completion-fish | source' >> ~/.config/fish/config.fish
```

That's all!

Now you have an autocompletion system for your CLI tool.