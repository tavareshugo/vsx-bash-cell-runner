# AGENTS.md

## Project overview

Bash Cell Runner is a small VS Code-compatible extension for executing Bash code with
`Ctrl+Enter` in Code-derived IDEs, particularly Positron.

The extension was created primarily for use with Positron, but should remain compatible
with VS Code and other IDEs based on the open-source Code platform.

The project is intentionally small and has no runtime dependencies beyond the standard
VS Code extension API.

## Primary use case

The author uses Positron as their main IDE.

Positron already provides useful `Ctrl+Enter` behaviour for executable R and Python
code in Quarto documents. Bash Cell Runner must therefore **coexist with**, rather than
replace, Positron's existing execution behaviour.

The extension should only claim `Ctrl+Enter` when the current editor position is a
Bash execution context.

Do not replace or globally override Positron's built-in:

    workbench.action.positronConsole.executeCode

command.

## Supported files

### Markdown and Quarto

The extension supports:

- `.md`
- `.qmd`

Only Bash fenced code blocks are executable.

Recognised Bash fences include:

    ```bash

    ```sh

    ```shell

and Quarto-style executable fences:

    ```{bash}

    ```{sh}

    ```{shell}

Other fenced languages, including R and Python, must remain under Positron's normal
control.

For example:

    ```{r}
    x <- 1:10
    ```

must continue to use Positron's R execution behaviour.

Likewise:

    ```{python}
    print("hello")
    ```

must continue to use Positron's Python execution behaviour.

### Shell scripts

The extension supports `.sh` files.

Every line of a `.sh` file is considered to be in a Bash execution context.

## Ctrl+Enter behaviour

The extension uses the context key:

    bashCell.insideBashFence

The keybinding is:

    {
        "key": "ctrl+enter",
        "command": "bashCell.executeLine",
        "when": "editorTextFocus && bashCell.insideBashFence"
    }

The extension is activated using:

    "onStartupFinished"

This is important.

The context key must be established before the user first presses `Ctrl+Enter`.
Previously the extension was activated only by invoking the command itself, which caused
the first `Ctrl+Enter` to be intercepted by Positron before the extension had established
its context.

Do not revert to command-only activation.

## Execution behaviour

### No selection

When there is no selection:

1. Execute the current physical line.
2. Send it to the dedicated Bash terminal.
3. Move the cursor to the start of the next line.
4. If the cursor is already on the final line, leave it there.

This is intended to mimic Positron's line-by-line `Ctrl+Enter` behaviour.

### Selection

When text is selected:

1. Execute exactly the selected text.
2. Send the selection to Bash as one block.
3. Keep the original selection highlighted.
4. Do not move the cursor or otherwise alter the selection.

This mirrors Positron's behaviour for selected executable code.

Do not automatically expand a partial-line selection to whole lines.

## Markdown/Quarto fence safety

The extension must be conservative when executing selections in `.md` and `.qmd`.

A selection must:

- be entirely inside a Bash fence;
- not include the opening Bash fence;
- not include the closing fence;
- not cross into ordinary Markdown;
- not cross into another language's code fence.

If a selection touches or contains a Bash fence delimiter, it must not execute.

Examples of fence delimiters include:

    ```bash
    ```sh
    ```shell
    ```{bash}
    ```{sh}
    ```{shell}

and:

    ```

The opening fence must never be sent to Bash.

The closing fence must never be sent to Bash.

## Terminal

Bash execution uses a dedicated integrated terminal named:

    Bash Cells

The terminal is created with:

    shellPath: "/bin/bash"

Its working directory should be the first workspace folder:

    vscode.workspace.workspaceFolders?.[0]?.uri.fsPath

The terminal should be reused rather than creating a new terminal for every execution.

It should be disposed when the extension is deactivated.

## Architecture

The main implementation currently lives in:

    extension.js

Important functions include:

- `isMarkdownOrQuarto()`
- `isShellScript()`
- `isBashFence()`
- `isClosingFence()`
- `isInsideBashFence()`
- `isBashExecutionContext()`
- `updateBashFenceContext()`
- `getBashTerminal()`
- `executeCurrentLine()`

The extension registers:

    bashCell.executeLine

The context key is updated when appropriate, including when:

- the active editor changes;
- the cursor/selection changes;
- the active document changes.

## Do not introduce unnecessary complexity

This is intentionally a small extension.

Do not add a large framework or unnecessary dependencies for simple functionality.

The current execution model is deliberately simple:

- current physical line, or
- selected text.

The extension does not need to parse Bash syntax.

In particular, it does not currently need to detect multi-line Bash constructs automatically.

For example:

    for file in *.csv; do
        echo "$file"
    done

should be executed by selecting the complete construct and pressing `Ctrl+Enter`.

Do not attempt to implement a Bash parser unless there is a concrete requirement for it.

## Project structure

The repository should remain approximately:

    bash-cell-runner/
    ├── .github/
    │   └── workflows/
    │       └── release.yml
    ├── .gitignore
    ├── .vscodeignore
    ├── AGENTS.md
    ├── README.md
    ├── extension.js
    ├── package.json
    └── package-lock.json

The generated `.vsix` file should NOT be committed to Git.

It is a build artifact and should be excluded by `.gitignore`.

## Packaging

The extension is packaged using `vsce`.

Local packaging:

    vsce package

This produces:

    bash-cell-runner-<version>.vsix

The repository contains a `.vscodeignore` file so that development files,
`.git`, `.vscode`, `node_modules`, and other unnecessary files are not included
in the VSIX.

## Releases

Releases are distributed through GitHub Releases rather than the VS Code Marketplace.

The GitHub repository is the source of truth.

A release is created using a Git tag such as:

    v0.1.0

The GitHub Actions workflow:

    .github/workflows/release.yml

is triggered when a GitHub Release is published.

The workflow:

1. Checks out the repository.
2. Sets up Node.js.
3. Runs `npm ci`.
4. Installs `@vscode/vsce`.
5. Runs `vsce package`.
6. Uploads the resulting `.vsix` to the GitHub Release.

The VSIX therefore does not need to be committed to the repository.

## Versioning

Use semantic versioning.

Examples:

- `0.1.0` — initial usable release
- `0.1.1` — bug fix
- `0.2.0` — backwards-compatible feature
- `1.0.0` — stable release

The version in `package.json` must match the intended release.

Git tags use a `v` prefix:

    package.json: "version": "0.2.0"
    Git tag:      v0.2.0

## Release workflow

Normal development:

    git add .
    git commit -m "Description"
    git push

For a release:

1. Update `version` in `package.json`.
2. Ensure `package-lock.json` is consistent.
3. Commit and push the changes.
4. Create a Git tag:

       git tag v0.2.0

5. Push the tag:

       git push origin v0.2.0

6. Create/publish the corresponding GitHub Release.
7. GitHub Actions builds and attaches the VSIX automatically.

Do not manually attach the VSIX to a release unless there is a specific reason to do so.

## Testing

The extension should be tested in a normal Positron installation as well as the
Extension Development Host.

At minimum, test:

### Quarto

- R chunk still uses Positron.
- Python chunk still uses Positron.
- Bash chunk uses Bash Cell Runner.
- Ordinary Markdown does not invoke Bash Cell Runner.
- Single-line Bash execution moves to the next line.
- Multi-line selection executes as a block.
- Selection remains highlighted after execution.
- Selection containing the opening fence does not execute.
- Selection containing the closing fence does not execute.
- Selection crossing a fence boundary does not execute.

### Markdown

Test the same Bash fence behaviour in `.md`.

### Shell scripts

Test:

- single-line execution;
- cursor movement;
- multi-line selection;
- selection preservation;
- final-line execution.

## Compatibility

Use the standard `vscode` API.

Do not introduce APIs that are specific to Microsoft VS Code if an equivalent
standard Code API exists.

Positron is the primary development/test environment, but the extension should
remain usable in other Code-derived IDEs.

## Important design principle

The most important design constraint is:

> Bash Cell Runner should add Bash execution to Code-derived IDEs without taking
> away the host IDE's existing language execution behaviour.

In particular, Positron's R and Python execution functionality in Quarto documents
is valuable and must remain intact.

## AI-assisted development disclosure

This project was developed with substantial assistance from OpenAI GPT-5.6 Luna.

AI assistance was used for architecture, implementation, debugging, documentation,
and development workflow decisions.

The code should be treated as AI-assisted software. Human review and testing remain
the responsibility of the project maintainer.

Future AI agents should inspect the actual source code and current tests before
assuming that the implementation still exactly matches this document.