#!/usr/bin/env node

import { parseArguments, validateArguments } from './modules/parser.js';
import { initializeTranslationClient, translateText } from './modules/translator.js';
import { loadGlossaryFromCSV, createOrUpdateGlossary } from './modules/glossaryManager.js';
import { handleError } from './utils/errorHandler.js';
import { CustomError } from './types/index.js';

async function main() {
  try {
    // コマンドライン引数を解析
    const args = parseArguments();

    // 引数を検証
    await validateArguments(args);

    // Translation APIクライアントを初期化
    const client = await initializeTranslationClient(args.account, args.project);

    // CSVから用語集を読み込み
    const glossaryData = await loadGlossaryFromCSV(args.glossary);

    // Google Cloudで用語集を作成または更新
    const glossaryId = await createOrUpdateGlossary(client, glossaryData, args.project);

    // 翻訳を実行
    await translateText(args.input, args.output, {
      client,
      from: args.from,
      to: args.to,
      glossaryId,
      projectId: args.project,
    });

    // 成功 - 静かに終了
    process.exit(0);
  } catch (error) {
    handleError(error as CustomError, 'translation process');
  }
}

// メイン関数を実行
main();
