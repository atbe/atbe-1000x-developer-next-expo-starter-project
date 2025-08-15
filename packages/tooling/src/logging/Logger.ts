import winston from "winston";
import path from "node:path";
import util from "node:util";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type LogFormat = "json" | "pretty";

interface LoggerOptions {
  level?: LogLevel;
  format?: LogFormat;
}

// Custom format to include file and line information
const includeCallSite = winston.format((info) => {
  const stack = new Error().stack;
  if (stack) {
    const lines = stack.split("\n");

    // Find the first line that's not from winston, this logger file, or node internals
    let callerLine = "";
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Skip winston internals
      if (line.includes("node_modules/winston")) continue;
      // Skip logform internals
      if (line.includes("node_modules/logform")) continue;
      // Skip readable-stream internals
      if (line.includes("node_modules/readable-stream")) continue;
      // Skip this logger file
      if (line.includes("Logger.ts") || line.includes("Logger.js")) continue;
      // Skip node internals
      if (
        line.includes("node:") ||
        line.includes("_stream_") ||
        line.includes("internal/")
      )
        continue;
      // Skip the getLogger utility
      if (line.includes("getLogger")) continue;
      // Skip native code
      if (line.includes("(native:") || line.includes("at native")) continue;
      // Skip any other node_modules
      if (line.includes("node_modules")) continue;

      // This should be our actual caller
      callerLine = line;
      break;
    }

    if (callerLine) {
      // Bun's format: "    at functionName (/full/path/to/file.ts:line:column)"
      // Or: "    at /full/path/to/file.ts:line"
      const match = callerLine.match(
        /at\s+(?:.*?\s+)?\(?(.*?):(\d+)(?::\d+)?\)?/
      );

      if (match) {
        const filePath = match[1];
        const lineNumber = match[2];
        if (filePath && !filePath.includes("node_modules")) {
          // Extract just the filename from the full path
          info.file = path.basename(filePath);
          info.line = lineNumber;
        }
      }
    }
  }
  return info;
});

// Custom format to handle circular references
const safeStringify = winston.format((info) => {
  // Handle circular references in metadata
  const seen = new WeakSet();
  const replacer = (_key: string, value: any) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }
    return value;
  };

  // Create a new object with safely stringified properties
  const safeInfo = { ...info };
  Object.keys(safeInfo).forEach((key) => {
    if (
      key !== "level" &&
      key !== "message" &&
      key !== "timestamp" &&
      key !== "file" &&
      key !== "line"
    ) {
      try {
        if (typeof safeInfo[key] === "object") {
          // Use util.inspect for pretty format to handle circular refs
          const splat = info[Symbol.for("splat")] as any;
          if (splat?.[0]?.format !== "json") {
            safeInfo[key] = util.inspect(safeInfo[key], {
              depth: 2,
              breakLength: Infinity,
            });
          } else {
            // For JSON format, use replacer
            return JSON.stringify(safeInfo[key], replacer, 2);
          }
        }
      } catch (_e) {
        safeInfo[key] = "[Unstringifiable]";
      }
    }
  });

  return safeInfo;
});

export class Logger {
  private winston: winston.Logger;
  private static globalLogger: Logger | null = null;
  private static globalOptions: LoggerOptions = {
    level: "info",
    format: "pretty",
  };
  private actualLevel: LogLevel;

  constructor(
    private readonly name: string,
    options?: LoggerOptions
  ) {
    const opts = { ...Logger.globalOptions, ...options };
    this.actualLevel = opts.level || "info";

    // Map 'fatal' to 'error' with a special flag since Winston doesn't have 'fatal'
    const winstonLevel = opts.level === "fatal" ? "error" : opts.level;

    const formats: winston.Logform.Format[] = [
      includeCallSite(),
      safeStringify(),
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
    ];

    if (opts.format === "json") {
      formats.push(
        winston.format.printf((info) => {
          // Remove internal metadata
          const { format: _format, __isFatal, ...cleanInfo } = info;

          // Handle fatal messages
          if (__isFatal) {
            cleanInfo.level = "fatal";
          }

          return JSON.stringify(cleanInfo, null, 2);
        })
      );
    } else {
      // Pretty format with colors
      formats.push(
        winston.format.colorize(),
        winston.format.printf(
          ({ level, message, timestamp, file, line, ...meta }) => {
            const fileInfo = file && line ? ` [${file}:${line}]` : "";
            let metaStr = "";

            // Remove internal metadata
            delete meta.format;

            // Handle metadata display
            if (Object.keys(meta).length > 0) {
              // Check if this is a fatal message
              if (meta.__isFatal) {
                delete meta.__isFatal;
                level = `${level} (FATAL)`;
              }

              if (Object.keys(meta).length > 0) {
                // For objects already processed by safeStringify
                const metaEntries = Object.entries(meta).map(([k, v]) => {
                  if (
                    typeof v === "string" &&
                    (v.startsWith("{") || v.startsWith("["))
                  ) {
                    // Already formatted, just indent it
                    const indented = v
                      .split("\n")
                      .map((line, i) => (i === 0 ? line : `  ${line}`))
                      .join("\n");
                    return `  "${k}": ${indented}`;
                  }
                  // Pretty print with indentation
                  const stringified = JSON.stringify(v, null, 2);
                  if (stringified === undefined) {
                    return `  "${k}": undefined`;
                  }
                  const indented = stringified
                    .split("\n")
                    .map((line, i) => (i === 0 ? line : `  ${line}`))
                    .join("\n");
                  return `  "${k}": ${indented}`;
                });
                metaStr = ` {\n${metaEntries.join(",\n")}\n}`;
              }
            }

            return `${timestamp} [${this.name}]${fileInfo} ${level}: ${message}${metaStr}`;
          }
        )
      );
    }

    this.winston = winston.createLogger({
      level: winstonLevel,
      format: winston.format.combine(...formats),
      transports: [new winston.transports.Console()],
    });

    // Store format info for child loggers
    this.winston.defaultMeta = { format: opts.format };
  }

  static parseLogLevel(level: string): LogLevel {
    switch (level) {
      case "debug":
        return "debug";
      case "info":
        return "info";
      case "warn":
        return "warn";
      case "error":
        return "error";
      default:
        throw new Error(`Invalid log level: ${level}`);
    }
  }

  static setGlobalOptions(options: LoggerOptions): void {
    Logger.globalOptions = { ...Logger.globalOptions, ...options };
    // Update existing global logger if it exists
    if (Logger.globalLogger) {
      Logger.globalLogger = new Logger("global", Logger.globalOptions);
    }
  }

  static getGlobalLogger(): Logger {
    if (!Logger.globalLogger) {
      Logger.globalLogger = new Logger("global", Logger.globalOptions);
    }
    return Logger.globalLogger;
  }

  static createLogger(name: string, options?: LoggerOptions): Logger {
    // Don't prefix with global logger name
    return new Logger(name, options);
  }

  debug(message: string, properties?: Record<string, unknown>): void {
    if (this.actualLevel === "fatal") return;
    this.winston.debug(message, properties);
  }

  info(message: string, properties?: Record<string, unknown>): void {
    if (this.actualLevel === "fatal") return;
    this.winston.info(message, properties);
  }

  warn(message: string, properties?: Record<string, unknown>): void {
    if (this.actualLevel === "fatal") return;
    this.winston.warn(message, properties);
  }

  error(message: string, properties?: Record<string, unknown>): void {
    if (this.actualLevel === "fatal") return;
    this.winston.error(message, properties);
  }

  fatal(message: string, properties?: Record<string, unknown>): void {
    // Use error level but add a fatal flag
    const meta = { ...properties, __isFatal: true };
    this.winston.error(message, meta);
  }

  // Create a child logger that inherits settings but has a different name
  child(name: string): Logger {
    const childName = `${this.name}:${name}`;
    return new Logger(childName, {
      level: this.actualLevel,
      format: this.winston.defaultMeta?.format || Logger.globalOptions.format,
    });
  }

  // Set the log level for this logger instance
  setLevel(level: LogLevel): void {
    this.actualLevel = level;
    this.winston.level = level === "fatal" ? "error" : level;
  }

  // Get current log level
  getLevel(): LogLevel {
    return this.actualLevel;
  }
}
