import { readFile, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';

export async function readTextFile(filePath: string): Promise<string> {
  try {
    const content = await readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${(error as Error).message}`);
  }
}

export async function writeTextFile(filePath: string, content: string): Promise<void> {
  try {
    await writeFile(filePath, content, 'utf8');
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${(error as Error).message}`);
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
