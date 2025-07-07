import { TranslationServiceClient } from '@google-cloud/translate';
import { readTextFile, writeTextFile } from '../utils/fileHandler.js';
import { TranslationOptions, CustomError } from '../types/index.js';

interface TranslateOptions {
  from: string;
  to: string;
  glossaryId: string;
  projectId: string;
}

export async function initializeTranslationClient(
  serviceAccountPath: string,
  projectId: string
): Promise<TranslationServiceClient> {
  try {
    // 認証用の環境変数を設定
    process.env.GOOGLE_APPLICATION_CREDENTIALS = serviceAccountPath;

    const client = new TranslationServiceClient({
      projectId: projectId,
      keyFilename: serviceAccountPath,
    });

    // クライアント接続をテスト
    console.log('Testing Translation API connection...');
    const parent = `projects/${projectId}/locations/us-central1`;
    await client.getSupportedLanguages({ parent });
    console.log('Translation API connection successful');

    return client;
  } catch (error) {
    const authError: CustomError = new Error(
      `Failed to initialize Translation client: ${(error as Error).message}`
    );
    authError.code = 'AUTH_FAILED';
    throw authError;
  }
}

export async function translateWithGlossary(
  client: TranslationServiceClient,
  text: string,
  options: TranslateOptions
): Promise<string> {
  try {
    const { from, to, glossaryId, projectId } = options;
    const location = 'us-central1';
    const parent = `projects/${projectId}/locations/${location}`;

    const request = {
      parent: parent,
      contents: [text],
      mimeType: 'text/plain' as const,
      sourceLanguageCode: from,
      targetLanguageCode: to,
      glossaryConfig: {
        glossary: glossaryId,
      },
    };

    const [response] = await client.translateText(request);

    if (response.glossaryTranslations && response.glossaryTranslations.length > 0) {
      // 利用可能な場合は用語集翻訳を使用
      return response.glossaryTranslations[0].translatedText || '';
    } else if (response.translations && response.translations.length > 0) {
      // 通常の翻訳にフォールバック
      return response.translations[0].translatedText || '';
    } else {
      throw new Error('No translation returned from API');
    }
  } catch (error) {
    const translationError: CustomError = new Error(
      `Translation failed: ${(error as Error).message}`
    );
    translationError.code = 'TRANSLATION_ERROR';
    throw translationError;
  }
}

export async function translateText(
  inputPath: string,
  outputPath: string,
  translationOptions: TranslationOptions
): Promise<void> {
  try {
    // 入力ファイルを読み込み
    const inputText = await readTextFile(inputPath);

    // テキストを翻訳
    const { client, ...options } = translationOptions;
    const translatedText = await translateWithGlossary(client, inputText, options);

    // 出力ファイルに書き込み
    await writeTextFile(outputPath, translatedText);
  } catch (error) {
    const err = error as CustomError;
    if (err.code === 'TRANSLATION_ERROR' || err.code === 'FILE_WRITE_ERROR') {
      throw error;
    }
    const translationError: CustomError = new Error(`Failed to translate file: ${err.message}`);
    translationError.code = 'TRANSLATION_ERROR';
    throw translationError;
  }
}
