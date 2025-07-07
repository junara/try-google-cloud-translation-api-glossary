export interface CommandLineArgs {
  from: string;
  to: string;
  glossary: string;
  input: string;
  output: string;
  account: string;
  project: string;
  help?: boolean;
  h?: boolean;
  _: string[];
  $0: string;
}

export interface GlossaryData {
  name: string;
  languageCodes: string[];
  entries: Record<string, string>[];
}

export interface TranslationOptions {
  client: any; // TranslationServiceClient
  from: string;
  to: string;
  glossaryId: string;
  projectId: string;
}

export interface CustomError extends Error {
  code?: string;
}
