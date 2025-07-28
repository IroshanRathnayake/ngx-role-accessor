/**
 * @fileoverview Logger utility for RBAC system
 * @author Iroshan Rathnayake
 * @version 1.0.0
 */

import { Injectable, Inject, Optional } from '@angular/core';
import { RBAC_CONFIG } from '../config/rbac.config';
import { RbacConfig } from '../types/rbac.types';

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Minimum log level to output */
  level: LogLevel;
  /** Whether to include timestamps */
  includeTimestamp: boolean;
  /** Custom log prefix */
  prefix: string;
  /** Whether to use colors in console output */
  useColors: boolean;
}

/**
 * Professional logger implementation for RBAC system
 * Provides structured logging with different levels and formatting
 */
@Injectable({
  providedIn: 'root'
})
export class RbacLogger {
  private config: LoggerConfig;

  constructor(
    @Inject(RBAC_CONFIG) @Optional() private rbacConfig?: RbacConfig
  ) {
    this.config = {
      level: this.rbacConfig?.enableDebugLogging ? LogLevel.DEBUG : LogLevel.WARN,
      includeTimestamp: true,
      prefix: '[NGX-RBAC]',
      useColors: true
    };
  }

  /**
   * Logs a debug message
   * 
   * @param message - The log message
   * @param context - Additional context data
   * 
   * @example
   * ```typescript
   * logger.debug('Role check performed', { userId: '123', role: 'admin' });
   * ```
   */
  debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Logs an informational message
   * 
   * @param message - The log message
   * @param context - Additional context data
   */
  info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Logs a warning message
   * 
   * @param message - The log message
   * @param context - Additional context data
   */
  warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Logs an error message
   * 
   * @param message - The log message
   * @param error - Error object or additional context
   */
  error(message: string, error?: Error | any): void {
    this.log(LogLevel.ERROR, message, error);
  }

  /**
   * Creates a child logger with additional context
   * 
   * @param context - Context to be included in all logs from this child logger
   * @returns A new logger instance with the additional context
   * 
   * @example
   * ```typescript
   * const userLogger = logger.child({ userId: '123' });
   * userLogger.info('User logged in'); // Will include userId in the log
   * ```
   */
  child(context: Record<string, any>): RbacLogger {
    const childLogger = new RbacLogger(this.rbacConfig);
    childLogger.config = { ...this.config };
    
    // Override log method to include context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level: LogLevel, message: string, additionalContext?: any) => {
      const mergedContext = { ...context, ...additionalContext };
      originalLog(level, message, mergedContext);
    };

    return childLogger;
  }

  /**
   * Updates the logger configuration
   * 
   * @param config - Partial configuration to merge with current config
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Core logging method
   * 
   * @private
   * @param level - Log level
   * @param message - Log message
   * @param context - Additional context data
   */
  private log(level: LogLevel, message: string, context?: any): void {
    if (level < this.config.level) {
      return;
    }

    const timestamp = this.config.includeTimestamp 
      ? new Date().toISOString() 
      : '';

    const levelName = LogLevel[level];
    const prefix = this.config.prefix;

    let logMessage = '';
    
    if (timestamp) {
      logMessage += `${timestamp} `;
    }
    
    logMessage += `${prefix} [${levelName}] ${message}`;

    const logMethod = this.getConsoleMethod(level);
    
    if (context) {
      logMethod(logMessage, context);
    } else {
      logMethod(logMessage);
    }
  }

  /**
   * Gets the appropriate console method based on log level
   * 
   * @private
   * @param level - Log level
   * @returns Console method to use
   */
  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * Performance timing utility
   * 
   * @param label - Label for the timer
   * @returns Function to call when timing is complete
   * 
   * @example
   * ```typescript
   * const endTimer = logger.time('permission-check');
   * // ... perform operation
   * endTimer(); // Logs the elapsed time
   * ```
   */
  time(label: string): () => void {
    const startTime = performance.now();
    this.debug(`Timer started: ${label}`);

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.debug(`Timer ended: ${label}`, { duration: `${duration.toFixed(2)}ms` });
    };
  }

  /**
   * Groups related log messages
   * 
   * @param label - Group label
   * @param collapsed - Whether the group should be collapsed by default
   * @returns Object with methods to log within the group and end the group
   * 
   * @example
   * ```typescript
   * const group = logger.group('Permission Check', true);
   * group.info('Checking user roles');
   * group.debug('User has roles: admin, user');
   * group.end();
   * ```
   */
  group(label: string, collapsed: boolean = false): {
    debug: (message: string, context?: any) => void;
    info: (message: string, context?: any) => void;
    warn: (message: string, context?: any) => void;
    error: (message: string, error?: Error | any) => void;
    end: () => void;
  } {
    if (collapsed) {
      console.groupCollapsed(`${this.config.prefix} ${label}`);
    } else {
      console.group(`${this.config.prefix} ${label}`);
    }

    return {
      debug: (message: string, context?: any) => this.debug(message, context),
      info: (message: string, context?: any) => this.info(message, context),
      warn: (message: string, context?: any) => this.warn(message, context),
      error: (message: string, error?: Error | any) => this.error(message, error),
      end: () => console.groupEnd()
    };
  }
}
