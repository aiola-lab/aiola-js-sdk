// Original source code: https://github.com/gillesdemey/node-record-lpcm16

const { ok: assert } = require("assert");
const { spawn } = require("child_process");

const debug =
  !!process.env.DEBUG && process.env.DEBUG.indexOf("record") !== -1
    ? console.debug
    : () => {};

class SoxRecording {
  options;
  process;
  soxStream;

  constructor(options = {}) {
    const defaults = {
      sampleRate: 16000,
      channels: 1,
      compress: false,
      threshold: 0.5,
      silence: "1.0",
      recorder: "sox",
      endOnSilence: false,
      audioType: "wav",
    };
    this.options = Object.assign(defaults, options);
    debug("Started recording");
    debug(this.options);
    return this.start();
  }

  start() {
    const cmd = "sox";
    const args = [
      "--default-device",
      "--no-show-progress", // show no progress
      "--rate",
      this.options.sampleRate.toString(), // sample rate
      "--channels",
      this.options.channels.toString(), // channels
      "--encoding",
      "signed-integer", // sample encoding
      "--bits",
      "16", // precision (bits)
      "--type",
      this.options.audioType, // audio type
      "-", // pipe
    ];
    debug(` ${cmd} ${args.join(" ")}`);

    const cp = spawn(cmd, args, {
      stdio: "pipe",
    });
    const rec = cp.stdout;
    const err = cp.stderr;

    this.process = cp; // expose child process
    this.soxStream = cp.stdout; // expose output stream

    cp.on("close", (code) => {
      if (code === 0) return;
      rec?.emit(
        "error",
        `${cmd} has exited with error code ${code}.\n\nEnable debugging with the environment variable debug=record.`
      );
    });

    err?.on("data", (chunk) => {
      debug(`STDERR: ${chunk}`);
    });

    rec?.on("data", (chunk) => {
      debug(`Recording ${chunk.length} bytes`);
    });

    rec?.on("end", () => {
      debug("Recording ended");
    });

    return this;
  }

  stop() {
    assert(this.process, "Recording not yet started");
    this.process.kill();
  }

  pause() {
    assert(this.process, "Recording not yet started");
    this.process.kill("SIGSTOP");
    this.soxStream?.pause();
    debug("Paused recording");
  }

  resume() {
    assert(this.process, "Recording not yet started");
    this.process.kill("SIGCONT");
    this.soxStream?.resume();
    debug("Resumed recording");
  }

  isPaused() {
    assert(this.process, "Recording not yet started");
    return this.soxStream?.isPaused();
  }

  stream() {
    assert(this?.soxStream, "Recording not yet started");
    return this.soxStream;
  }
}

module.exports = { SoxRecording }; 