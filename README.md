# Bash Cell Runner

A small extension for VS Code-compatible editors that makes **Ctrl+Enter** useful for Bash code in Markdown, Quarto, and shell scripts.

It is designed to work with Code-derived IDEs, including **Positron**, VS Code, and other compatible editors.

## Features

### Bash code in Markdown and Quarto

Execute Bash code directly from fenced code blocks in `.md` and `.qmd` files.

Both standard Markdown fences:

````markdown
```bash
echo "Hello"
ls -la
```
````

and Quarto-style executable fences:

````markdown
```{bash}
echo "Hello"
ls -la
```
````

are supported.

Place the cursor on a line and press **Ctrl+Enter** to execute that line.

The cursor then moves to the beginning of the next line, mimicking the behaviour of Positron's executable cells.

### Multi-line selections

Select multiple lines of Bash and press **Ctrl+Enter** to execute the selection as a single block.

For example:

````markdown
```bash
for file in *.csv; do
    echo "$file"
done
```
````

Select the entire block and press **Ctrl+Enter**.

The selected text remains highlighted after execution.

Selections that include a Markdown/Quarto fence delimiter are not executed.

### Shell scripts

The extension also supports `.sh` files.

For example:

```bash
#!/usr/bin/env bash

echo "Hello"
ls -la
pwd
```

In a `.sh` file:

* **Ctrl+Enter with no selection** executes the current line and moves to the next line.
* **Ctrl+Enter with a selection** executes the selected text and keeps the selection highlighted.

### Dedicated Bash terminal

Commands are sent to a dedicated integrated terminal named:

```text
Bash Cells
```

This keeps Bash cell execution separate from other terminals you may be using for R, Python, or other tasks.

The terminal starts in the workspace directory.

## Interaction with Positron

This extension is designed to coexist with Positron's existing **Ctrl+Enter** behaviour.

For example, in a Quarto document:

````markdown
```{r}
x <- 1:10
mean(x)
```

```{python}
print("Hello")
```

```{bash}
echo "Hello"
```
````

Ctrl+Enter behaves as follows:

| Context           | Behaviour                               |
| ----------------- | --------------------------------------- |
| R chunk           | Positron executes the R code            |
| Python chunk      | Positron executes the Python code       |
| Bash chunk        | Bash Cell Runner executes the Bash code |
| Ordinary Markdown | Positron's normal behaviour             |
| `.sh` file        | Bash Cell Runner executes the Bash code |
| `.r` file         | Positron's normal behaviour             |
| `.py` file        | Positron's normal behaviour             |

The extension uses a VS Code context key to activate its keybinding only when the cursor is in a Bash execution context. It therefore does not need to override Positron's built-in `Ctrl+Enter` command.

## Installation

### Pre-built VSIX

Download the pre-built `.vsix` file from the [GitHub releases page](https://github.com/tavareshugo/bash-cell-runner/releases).

Then, install with:

```bash
positron --install-extension bash-cell-runner-0.1.0.vsix
code --install-extension bash-cell-runner-0.1.0.vsix
```

### Development

Clone or download the repository and open the extension directory in a Code-compatible IDE:

```bash
git clone https://github.com/tavareshugo/bash-cell-runner.git
cd bash-cell-runner
```

Then open the directory in Positron or VS Code.

Press **F5** and select:

```text
VS Code Extension Developer
```

This launches an Extension Development Host containing the extension.

You can then test it in `.md`, `.qmd`, and `.sh` files.

### Build VSIX from source

To create an installable VSIX package from the source code, install the VS Code Extension Manager:

```bash
npm install --global @vscode/vsce
```

Then clone and create the VSIX from the extension directory:

```bash
git clone https://github.com/tavareshugo/bash-cell-runner.git
cd bash-cell-runner
vsce package
```

This produces a file such as:

```text
bash-cell-runner-0.1.0.vsix
```

The resulting VSIX can be installed into compatible Code-derived IDEs using their **Install from VSIX** functionality or their command-line interface.

## Keybinding

Add the following to your `keybindings.json`:

```json
{
    "key": "ctrl+enter",
    "command": "bashCell.executeLine",
    "when": "editorTextFocus && bashCell.insideBashFence"
}
```

The extension maintains the `bashCell.insideBashFence` context key automatically.

For `.sh` files, the context is also enabled because the entire file is considered a Bash execution context.

## Supported file types

| File type | Support            |
| --------- | ------------------ |
| `.md`     | Bash fenced blocks |
| `.qmd`    | Bash fenced blocks |
| `.sh`     | Entire file        |

The following fence formats are recognised:

````markdown
```bash
````

````markdown
```sh
````

````markdown
```shell
````

````markdown
```{bash}
````

````markdown
```{sh}
````

````markdown
```{shell}
````

## Limitations

The extension intentionally keeps its behaviour simple.

It executes either:

* the current physical line; or
* the selected text.

It does not currently attempt to determine whether an unselected line is part of a multi-line Bash construct.

For example:

```bash
for file in *.csv; do
    echo "$file"
done
```

is best executed by selecting the complete construct and pressing **Ctrl+Enter**.

Likewise, constructs involving continuation lines, here-documents, or other multi-line shell syntax should generally be selected as a complete block.

## Configuration

The Bash executable is currently configured as:

```text
/bin/bash
```

The Bash execution terminal is named:

```text
Bash Cells
```

The terminal uses the first workspace folder as its working directory.

These may be made configurable in a future version if there is a need for it.

## Development

The extension is intentionally small and has no runtime dependencies.

The basic project structure is:

```text
bash-cell-runner/
├── package.json
├── extension.js
└── README.md
```

The main extension implementation is contained in `extension.js`.

After making changes, restart the Extension Development Host with **Ctrl+Shift+F5** or stop and start the extension debugger again.

## Compatibility

The extension uses the standard `vscode` extension API and is intended for **Code-derived IDEs**, rather than relying on Microsoft VS Code-specific functionality.

It has been developed and tested primarily with **Positron**, but should also be suitable for other compatible editors.

Compatibility may depend on the particular Code API version provided by the host IDE.

## AI disclosure

This extension was developed with substantial assistance from **OpenAI GPT-5.6 Luna**.

The extension architecture, JavaScript implementation, debugging process, and documentation were developed collaboratively through an AI-assisted process. The code should therefore be treated as **AI-assisted software**, rather than as code written entirely by a human developer.

The author is responsible for reviewing, testing, maintaining, and deciding whether the code is appropriate for their environment.

No claim is made that the generated code is free from bugs or security issues.

## License

MIT License.
