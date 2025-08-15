export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type LogFormat = "json" | "pretty";

interface LoggerOptions {
  level?: LogLevel;
  format?: LogFormat;
}

export class WorkersLogger {
  private readonly name: string;
  private readonly level: LogLevel;
  private readonly format: LogFormat;

  private static levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  };

  constructor(name: string, options?: LoggerOptions) {
    this.name = name;
    this.level = options?.level || "info";
    this.format = options?.format || "pretty";
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
      case "fatal":
        return "fatal";
      default:
        throw new Error(`Invalid log level: ${level}`);
    }
  }

  static createLogger(name: string, options?: LoggerOptions): WorkersLogger {
    return new WorkersLogger(name, options);
  }

  private shouldLog(level: LogLevel): boolean {
    return (
      WorkersLogger.levelPriority[level] >=
      WorkersLogger.levelPriority[this.level]
    );
  }

  private safeStringify(obj: any, seen = new WeakSet()): string {
    // Handle primitives
    if (obj === null) return "null";
    if (obj === undefined) return "undefined";
    if (typeof obj === "string") return JSON.stringify(obj);
    if (typeof obj !== "object") return String(obj);

    // Handle circular references
    if (seen.has(obj)) return "[Circular]";
    seen.add(obj);

    // Handle arrays
    if (Array.isArray(obj)) {
      const items = obj.map((item) => {
        try {
          return this.safeStringify(item, seen);
        } catch {
          return "[Unstringifiable]";
        }
      });
      return `[${items.join(", ")}]`;
    }

    // Handle Error objects
    if (obj instanceof Error) {
      return `Error: ${obj.message}${obj.stack ? `\n${obj.stack}` : ""}`;
    }

    // Handle regular objects
    try {
      const entries = Object.entries(obj).map(([key, value]) => {
        try {
          const stringifiedValue = this.safeStringify(value, seen);
          return `"${key}": ${stringifiedValue}`;
        } catch {
          return `"${key}": "[Unstringifiable]"`;
        }
      });
      return `{${entries.join(", ")}}`;
    } catch {
      return "[Unstringifiable]";
    }
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    properties?: Record<string, unknown>
  ): string {
    const timestamp = new Date().toISOString();

    if (this.format === "json") {
      // For JSON format, handle circular references
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

      try {
        return JSON.stringify(
          {
            timestamp,
            level,
            logger: this.name,
            message,
            ...properties,
          },
          replacer
        );
      } catch (_e) {
        // Fallback if JSON.stringify fails
        return JSON.stringify({
          timestamp,
          level,
          logger: this.name,
          message,
          error: "Failed to stringify properties",
        });
      }
    } else {
      // Pretty format - enhanced to handle complex objects better
      let output = `${timestamp} [${this.name}] ${level.toUpperCase()}: ${message}`;

      if (properties && Object.keys(properties).length > 0) {
        // Format each property individually
        const formattedProps = Object.entries(properties).map(
          ([key, value]) => {
            try {
              // Handle different types of values
              if (value === null || value === undefined) {
                return `"${key}": ${value}`;
              } else if (typeof value === "object") {
                return `"${key}": ${this.safeStringify(value)}`;
              } else {
                return `"${key}": ${JSON.stringify(value)}`;
              }
            } catch {
              return `"${key}": "[Unstringifiable]"`;
            }
          }
        );

        output += ` {${formattedProps.join(", ")}}`;
      }

      return output;
    }
  }

  debug(message: string, properties?: Record<string, unknown>): void {
    if (this.shouldLog("debug")) {
      console.log(this.formatMessage("debug", message, properties));
    }
  }

  info(message: string, properties?: Record<string, unknown>): void {
    if (this.shouldLog("info")) {
      console.log(this.formatMessage("info", message, properties));
    }
  }

  warn(message: string, properties?: Record<string, unknown>): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, properties));
    }
  }

  error(message: string, properties?: Record<string, unknown>): void {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message, properties));
    }
  }

  fatal(message: string, properties?: Record<string, unknown>): void {
    if (this.shouldLog("fatal")) {
      console.error(this.formatMessage("fatal", message, properties));
    }
  }

  child(name: string): WorkersLogger {
    return new WorkersLogger(`${this.name}:${name}`, {
      level: this.level,
      format: this.format,
    });
  }

  setLevel(_level: LogLevel): void {
    // For compatibility, but doesn't actually change the level in this implementation
    console.warn(`setLevel is not supported in WorkersLogger`);
  }

  getLevel(): LogLevel {
    return this.level;
  }
}
