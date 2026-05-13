const path      = require('path');
const chalk     = require('chalk');
const extractor = require('./src/extractor');

/// Load configuration from config file
let config;
try {
  config = require('./config.json');
} catch (e) {
  console.error(chalk.red('config.json not found.'));
  process.exit(1);
}

// Creating output files for raw data dump
config.outputDir = path.resolve(__dirname, config.outputDir);

// Run the application
extractor.run(config).catch(err => {
  console.error(chalk.red('\nFatal error: ' + err.message));
  console.error(err.stack);
  process.exit(1);
});
