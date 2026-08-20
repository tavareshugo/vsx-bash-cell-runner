const vscode = require("vscode");

let bashTerminal = null;

const BASH_FENCE_PATTERN =
    /^\s*```\s*(?:\{)?\s*(bash|sh|shell)\s*(?:\})?\s*$/;

const CLOSING_FENCE_PATTERN = /^\s*```\s*$/;

function isMarkdownOrQuarto(document) {
    const fileName = document.fileName.toLowerCase();

    return fileName.endsWith(".md") || fileName.endsWith(".qmd");
}

function isShellScript(document) {
    return document.fileName.toLowerCase().endsWith(".sh");
}

function isBashFence(line) {
    return BASH_FENCE_PATTERN.test(line);
}

function isClosingFence(line) {
    return CLOSING_FENCE_PATTERN.test(line);
}

function isInsideBashFence(document, cursorLine) {
    let insideBash = false;

    for (let lineNumber = 0; lineNumber <= cursorLine; lineNumber++) {
        const line = document.lineAt(lineNumber).text;

        if (isBashFence(line)) {
            insideBash = true;
            continue;
        }

        if (insideBash && isClosingFence(line)) {
            insideBash = false;
        }
    }

    return insideBash;
}

/**
 * Determine whether the current cursor position is in a context
 * where Bash cell execution should be available.
 */
function isBashExecutionContext(editor) {
    const document = editor.document;

    // Every line in a .sh file is a Bash execution context.
    if (isShellScript(document)) {
        return true;
    }

    if (!isMarkdownOrQuarto(document)) {
        return false;
    }

    const selection = editor.selection;

    // No selection: check the cursor position.
    if (selection.isEmpty) {
        return isInsideBashFence(
            document,
            selection.active.line
        );
    }

    // A selection must be entirely inside a Bash fence.
    const startLine = selection.start.line;
    const endLine = selection.end.line;

    // Check every line touched by the selection.
    for (let lineNumber = startLine; lineNumber <= endLine; lineNumber++) {
        const line = document.lineAt(lineNumber).text;

        // Never allow a selection containing a fence delimiter
        // to be executed.
        if (isBashFence(line) || isClosingFence(line)) {
            return false;
        }

        if (!isInsideBashFence(document, lineNumber)) {
            return false;
        }
    }

    return true;
}

/**
 * Update the context key used by the Ctrl+Enter keybinding.
 */
function updateBashFenceContext() {
    const editor = vscode.window.activeTextEditor;

    const enabled = editor
        ? isBashExecutionContext(editor)
        : false;

    vscode.commands.executeCommand(
        "setContext",
        "bashCell.insideBashFence",
        enabled
    );
}

/**
 * Get or create the dedicated terminal used for Bash execution.
 */
function getBashTerminal() {
    if (!bashTerminal) {
        bashTerminal = vscode.window.createTerminal({
            name: "Bash Cells",
            shellPath: "/bin/bash",
            cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
        });
    }

    return bashTerminal;
}

/**
 * Execute the current line.
 */
function executeCurrentLine() {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return;
    }

    const document = editor.document;

    if (!isBashExecutionContext(editor)) {
        return;
    }

    const selection = editor.selection;

    let text;
    let endLine;

    if (!selection.isEmpty) {
        // Execute the selected text exactly as selected.
        text = document.getText(selection);

        // Remember the selection; Positron keeps it highlighted
        // after execution.
        const originalSelection = selection;

        if (!text.trim()) {
            return;
        }

        const terminal = getBashTerminal();

        terminal.show(true);
        terminal.sendText(text, true);

        // Restore the original selection.
        editor.selection = originalSelection;

        return;
    }

    // No selection: execute the current line.
    const cursorLine = selection.active.line;
    const currentLine = document.lineAt(cursorLine).text;

    // Don't execute Markdown fence delimiters.
    if (isBashFence(currentLine) || isClosingFence(currentLine)) {
        return;
    }

    text = currentLine;

    if (!text.trim()) {
        return;
    }

    const terminal = getBashTerminal();

    terminal.show(true);
    terminal.sendText(text, true);

    // No selection: move the cursor to the start of the next line.
    if (cursorLine < document.lineCount - 1) {
        const nextPosition = new vscode.Position(cursorLine + 1, 0);

        editor.selection = new vscode.Selection(
            nextPosition,
            nextPosition
        );

        editor.revealRange(
            new vscode.Range(nextPosition, nextPosition),
            vscode.TextEditorRevealType.InCenterIfOutsideViewport
        );
    }

    updateBashFenceContext();
}

/**
 * Activate the extension.
 */
function activate(context) {
    const command = vscode.commands.registerCommand(
        "bashCell.executeLine",
        executeCurrentLine
    );

    context.subscriptions.push(command);

    // Update context when switching editors.
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => {
            updateBashFenceContext();
        })
    );

    // Update context when moving the cursor.
    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorSelection(() => {
            updateBashFenceContext();
        })
    );

    // Update context when the document changes.
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((event) => {
            const editor = vscode.window.activeTextEditor;

            if (editor && event.document === editor.document) {
                updateBashFenceContext();
            }
        })
    );

    // Set initial context.
    updateBashFenceContext();

    // Clean up the terminal when the extension is deactivated.
    context.subscriptions.push({
        dispose: () => {
            if (bashTerminal) {
                bashTerminal.dispose();
                bashTerminal = null;
            }
        }
    });
}

/**
 * Deactivate the extension.
 */
function deactivate() {
    if (bashTerminal) {
        bashTerminal.dispose();
        bashTerminal = null;
    }
}

module.exports = {
    activate,
    deactivate
};