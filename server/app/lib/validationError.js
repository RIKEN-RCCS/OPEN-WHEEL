/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

/**
 * Represents a validation error with an optional ignoreable flag.
 * All validators in WHEEL use this class instead of plain Error objects so that
 * the client can distinguish between hard errors and soft warnings that the user
 * may choose to ignore.
 */
export class ValidationError extends Error {
  /**
   * @param {string} message - Human-readable description of the validation failure
   * @param {object} [options] - Additional options
   * @param {boolean} [options.ignoreable] - Whether the user is allowed to ignore this error and proceed anyway
   */
  constructor(message, { ignoreable = false } = {}) {
    super(message);
    this.name = "ValidationError";
    this.ignoreable = ignoreable;
  }
}
