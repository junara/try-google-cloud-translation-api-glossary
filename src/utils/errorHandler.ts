import { CustomError } from '../types/index.js';

export function handleError(error: CustomError, context?: string): never {
  let message = `Error`;
  if (context) {
    message += ` in ${context}`;
  }
  message += `: ${error.message}`;

  console.error(message);
  process.exit(getExitCode(error));
}

export function logError(message: string, details?: string): void {
  console.error(`Error: ${message}`);
  if (details) {
    console.error(`Details: ${details}`);
  }
}

function getExitCode(error: CustomError): number {
  if (
    error.code === 'ARG_MISSING' ||
    error.code === 'FILE_NOT_FOUND' ||
    error.code === 'INVALID_LANG_CODE'
  ) {
    return 1;
  }
  if (error.code === 'AUTH_FAILED') {
    return 2;
  }
  if (error.code === 'GLOSSARY_ERROR') {
    return 3;
  }
  if (error.code === 'TRANSLATION_ERROR') {
    return 4;
  }
  if (error.code === 'FILE_WRITE_ERROR') {
    return 5;
  }
  return 1;
}
