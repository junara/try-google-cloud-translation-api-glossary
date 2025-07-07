import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { fileExists } from '../utils/fileHandler.js';
import { CommandLineArgs, CustomError } from '../types/index.js';

export function parseArguments(): CommandLineArgs {
  const argv = yargs(hideBin(process.argv))
    .option('from', {
      alias: 'f',
      describe: 'Source language code',
      type: 'string',
      demandOption: true,
    })
    .option('to', {
      alias: 't',
      describe: 'Target language code',
      type: 'string',
      demandOption: true,
    })
    .option('glossary', {
      alias: 'g',
      describe: 'Glossary CSV file path',
      type: 'string',
      demandOption: true,
    })
    .option('input', {
      alias: 'i',
      describe: 'Input text file path',
      type: 'string',
      demandOption: true,
    })
    .option('output', {
      alias: 'o',
      describe: 'Output text file path',
      type: 'string',
      demandOption: true,
    })
    .option('account', {
      alias: 'a',
      describe: 'Service account key JSON file path',
      type: 'string',
      demandOption: true,
    })
    .option('project', {
      alias: 'p',
      describe: 'Google Cloud project ID',
      type: 'string',
      demandOption: true,
    })
    .help()
    .alias('help', 'h')
    .version(false).argv as CommandLineArgs;

  return argv;
}

export async function validateArguments(args: CommandLineArgs): Promise<void> {
  const errors: string[] = [];

  // 言語コードを検証（2文字コードの基本チェック）
  if (!isValidLanguageCode(args.from)) {
    errors.push(`Invalid source language code: ${args.from}`);
  }
  if (!isValidLanguageCode(args.to)) {
    errors.push(`Invalid target language code: ${args.to}`);
  }

  // ファイルの存在を確認
  if (!(await fileExists(args.input))) {
    const error: CustomError = new Error(`Input file not found: ${args.input}`);
    error.code = 'FILE_NOT_FOUND';
    throw error;
  }
  if (!(await fileExists(args.glossary))) {
    const error: CustomError = new Error(`Glossary file not found: ${args.glossary}`);
    error.code = 'FILE_NOT_FOUND';
    throw error;
  }
  if (!(await fileExists(args.account))) {
    const error: CustomError = new Error(`Service account key file not found: ${args.account}`);
    error.code = 'FILE_NOT_FOUND';
    throw error;
  }

  // プロジェクトIDの形式を検証（基本チェック）
  if (!isValidProjectId(args.project)) {
    errors.push(`Invalid project ID format: ${args.project}`);
  }

  if (errors.length > 0) {
    const error: CustomError = new Error(errors.join('\n'));
    error.code = 'INVALID_ARGS';
    throw error;
  }
}

function isValidLanguageCode(code: string): boolean {
  // ISO 639-1コード（2文字）またはzh-CNのような拡張コードの基本検証
  return /^[a-z]{2}(-[A-Z]{2})?$/.test(code);
}

function isValidProjectId(projectId: string): boolean {
  // Google CloudプロジェクトIDの形式: 6-30文字の小文字、数字、またはハイフン
  return /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId);
}
