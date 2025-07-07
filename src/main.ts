#!/usr/bin/env node

import { parseArguments, validateArguments } from './modules/parser.js';
import { initializeTranslationClient, translateText } from './modules/translator.js';
import { loadGlossaryFromCSV, createOrUpdateGlossary } from './modules/glossaryManager.js';
import { handleError } from './utils/errorHandler.js';
import { CustomError } from './types/index.js';

async function main() {
  try {
    // Parse command line arguments
    const args = parseArguments();

    // Validate arguments
    await validateArguments(args);

    // Initialize Translation API client
    const client = await initializeTranslationClient(args.account, args.project);

    // Load glossary from CSV
    const glossaryData = await loadGlossaryFromCSV(args.glossary);

    // Create or update glossary in Google Cloud
    const glossaryId = await createOrUpdateGlossary(client, glossaryData, args.project);

    // Perform translation
    await translateText(args.input, args.output, {
      client,
      from: args.from,
      to: args.to,
      glossaryId,
      projectId: args.project,
    });

    // Success - exit silently
    process.exit(0);
  } catch (error) {
    handleError(error as CustomError, 'translation process');
  }
}

// Run main function
main();
