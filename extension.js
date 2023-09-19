const vscode = require("vscode");
const { exec } = require("child_process");
const kill = require("tree-kill");

let window = vscode.window;

const strings = {
  extensionName: "fast-gulp",
  outputChannelName: "Fast Gulp",

  noExtensionFolder: "No workspace folder found.",

  gulp: {
    isNotStarted: "'gulp' is not started.",
    isAlreadyStarted: "'gulp' is already started.",
  },

  statusBar: {
    start: "Start 'gulp'",
    startDisplay: "$(play) gulp",
    stop: "Stop 'gulp'",
    stopDisplay: "$(stop) gulp",
  },

  log: {
    start: "Starting 'gulp'...",
    stop: "Stopping 'gulp'...",
  },
};

const commands = {
  startGulp: `${strings.extensionName}.startGulp`,
  stopGulp: `${strings.extensionName}.stopGulp`,
};

let cProcess = null; // Variable to store the running gulp process
const statusBarItem = window.createStatusBarItem(
  vscode.StatusBarAlignment.Right
);

const outputChannel = window.createOutputChannel(strings.outputChannelName);

function cleanText(text) {
  /* to make the text ready for output channel */

  // remove color ANSI codes
  text = text.replace(/\x1B\[[0-9;]*[JKmsu]/g, "");

  return text;
}

function outputToChannel(text) {
  return outputChannel.appendLine(cleanText(text));
}

function startGulp() {
  outputToChannel(strings.log.start);

  statusBarItem.text = strings.statusBar.stopDisplay;
  statusBarItem.tooltip = strings.statusBar.stop;
  statusBarItem.command = commands.stopGulp;
  statusBarItem.show();

  outputChannel.show();

  if (cProcess) {
    window.showErrorMessage(strings.gulp.isAlreadyStarted);
  }

  cProcess = exec("gulp");

  cProcess.stdout.on("data", (data) => {
    outputToChannel(`[STDOUT]: ${data.toString()}`);
  });

  cProcess.stderr.on("data", (data) => {
    outputToChannel(`[STDERR]: ${data.toString()}`);
  });

  cProcess.on("close", (code) => {
    if (code === 0 || code === 1) {
      outputToChannel("Successfully closed.");
    } else {
      let close_text = `[--ERROR--]: Failed with exit code ${code}.`;
      window.showErrorMessage(close_text);
      outputToChannel(close_text);
    }
  });

  cProcess.on("error", (error) => {
    let error_text = `[--ERROR--]: ${error.message}`;
    window.showErrorMessage(error_text);
    outputToChannel(error_text);
    cProcess = null;
  });
  outputToChannel("done");
}

function stopGulp() {
  outputToChannel(strings.log.stop);

  statusBarItem.text = strings.statusBar.startDisplay;
  statusBarItem.tooltip = strings.statusBar.start;
  statusBarItem.command = commands.startGulp;
  statusBarItem.show();

  if (cProcess) {
    kill(cProcess.pid);
    cProcess = null; // Reset gulpProcess
  } else {
    window.showErrorMessage(strings.gulp.isNotStarted);
  }
  outputToChannel("done");
}

function activate({ subscriptions }) {
  outputToChannel("[INFO]: Activated the extension.");

  statusBarItem.text = strings.statusBar.startDisplay;
  statusBarItem.tooltip = strings.statusBar.start;
  statusBarItem.command = commands.startGulp;
  statusBarItem.show();

  const workspacePath = vscode.workspace.workspaceFolders
    .map((folder) => folder.uri.path)
    .toString()
    .slice(1);
  if (!workspacePath) {
    window.showErrorMessage(strings.noExtensionFolder);
    return;
  }
  process.chdir(workspacePath);

  subscriptions.push(
    vscode.commands.registerCommand(commands.startGulp, startGulp),
    vscode.commands.registerCommand(commands.stopGulp, stopGulp)
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
