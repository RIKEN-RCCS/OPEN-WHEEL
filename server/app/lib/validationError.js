/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

/**
 * Create a plain validation error object.
 * Returns a plain JS object so that it serialises correctly over socket.io
 * (Error subclasses lose their non-enumerable `message` property during JSON serialisation).
 * @param {string} message - Human-readable description of the validation failure
 * @param {object} [options] - Additional options
 * @param {boolean} [options.ignoreable] - Whether the user is allowed to ignore this error and proceed anyway
 * @returns {{ message: string, ignoreable: boolean }}
 */
export function createValidationError(message, { ignoreable = false } = {}) {
  return { message, ignoreable };
}
