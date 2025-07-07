import { parse } from 'csv-parse/sync';
import { readTextFile } from '../utils/fileHandler.js';
import { Storage } from '@google-cloud/storage';
import { GlossaryData, CustomError } from '../types/index.js';
import { TranslationServiceClient } from '@google-cloud/translate';

const GLOSSARY_NAME = 'translation-glossary';

export async function loadGlossaryFromCSV(csvPath: string): Promise<GlossaryData> {
  try {
    const csvContent = await readTextFile(csvPath);
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    if (records.length === 0) {
      throw new Error('No entries found in glossary CSV');
    }

    // 最初のレコードのキーから言語コードを取得
    const languageCodes = Object.keys(records[0]);

    // レコードをエントリに変換
    const entries = records.map(record => {
      const entry: Record<string, string> = {};
      languageCodes.forEach(lang => {
        if (record[lang]) {
          entry[lang] = record[lang];
        }
      });
      return entry;
    });

    return {
      name: GLOSSARY_NAME,
      languageCodes,
      entries,
    };
  } catch (error) {
    const glossaryError: CustomError = new Error(
      `Failed to load glossary from CSV: ${(error as Error).message}`
    );
    glossaryError.code = 'GLOSSARY_ERROR';
    throw glossaryError;
  }
}

export async function createOrUpdateGlossary(
  client: TranslationServiceClient,
  glossaryData: GlossaryData,
  projectId: string
): Promise<string> {
  try {
    const location = 'us-central1';
    const parent = `projects/${projectId}/locations/${location}`;
    const glossaryId = `projects/${projectId}/locations/${location}/glossaries/${GLOSSARY_NAME}`;

    // 用語集が存在するか確認
    try {
      await client.getGlossary({ name: glossaryId });
      // 存在する場合はまず削除
      const [operation] = await client.deleteGlossary({ name: glossaryId });
      await operation.promise();
    } catch (_error) {
      // 用語集が存在しないことは問題ない
    }

    const { languageCodes, entries } = glossaryData;

    // 同義語セット用にエントリをCSV形式に変換
    // 多言語用語集の場合、カンマ区切りのCSV形式が必要
    const headers = languageCodes.join(',');
    const rows = entries.map(entry => languageCodes.map(lang => entry[lang] || '').join(','));
    const csvContent = [headers, ...rows].join('\n');

    // Storageクライアントを初期化
    const storage = new Storage({ projectId });

    // Terraformで作成したバケットを使用
    const bucketName = `${projectId}-translation-glossary`;
    const bucket = storage.bucket(bucketName);

    // CSVコンテンツをCloud Storageにアップロード
    const fileName = `${GLOSSARY_NAME}.csv`;
    const file = bucket.file(fileName);

    console.log('CSV Content:', csvContent);
    console.log('Uploading to:', `gs://${bucketName}/${fileName}`);

    await file.save(csvContent, {
      metadata: {
        contentType: 'text/csv',
      },
    });

    // 多言語サポート用にGCSソースで用語集を作成
    const glossaryConfig = {
      languageCodesSet: {
        languageCodes: languageCodes,
      },
      inputConfig: {
        gcsSource: {
          inputUri: `gs://${bucketName}/${fileName}`,
        },
      },
      name: `${parent}/glossaries/${GLOSSARY_NAME}`,
    };

    const glossaryRequest = {
      parent: parent,
      glossary: glossaryConfig,
    };

    console.log('Glossary Request:', JSON.stringify(glossaryRequest, null, 2));

    // 用語集を作成
    const [operation] = await client.createGlossary(glossaryRequest);

    // 操作の完了を待機
    console.log('Waiting for glossary creation to complete...');
    const [createdGlossary] = await operation.promise();

    console.log('Glossary created successfully:', createdGlossary.name);
    return createdGlossary.name || '';
  } catch (error) {
    const glossaryError: CustomError = new Error(
      `Failed to create/update glossary: ${(error as Error).message}`
    );
    glossaryError.code = 'GLOSSARY_ERROR';
    throw glossaryError;
  }
}

export async function deleteGlossary(
  client: TranslationServiceClient,
  glossaryId: string,
  projectId: string
): Promise<void> {
  try {
    const location = 'us-central1';
    const name = `projects/${projectId}/locations/${location}/glossaries/${glossaryId}`;
    await client.deleteGlossary({ name });
  } catch (_error) {
    // 削除エラーを無視
  }
}
