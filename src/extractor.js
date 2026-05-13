
// full extraction — calls tallyClient, parses, saves

const chalk  = require('chalk');
const ora    = require('ora');
const client = require('./tallyClient');
const {
  parseXML,
  saveJSON,
  withRetry,
  splitDateRangeByMonth,
  toArray,
} = require('./utils/convertor');
const {
  ACCOUNTING_MASTERS,
  INVENTORY_MASTERS,
  CONFIG_MASTERS,
  PAYROLL_MASTERS,
  GST_MASTERS,
  VOUCHER_TYPES,
  PAYROLL_VOUCHER_TYPES,
  FINANCIAL_REPORTS,
} = require('./collections');

let OUTPUT_DIR;
let RETRY_ATTEMPTS;
let RETRY_DELAY;

// Detect open company
async function detectCompany(configCompany) {
  const spinner = ora('Detecting open company in Tally...').start();
  try {
    const raw    = await withRetry('getOpenCompanies', () => client.getOpenCompanies(), 3, 2000);
    const parsed = await parseXML(raw);

    const companies = toArray(
      parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.COMPANY
    );

    if (!companies.length) {
      spinner.fail('No company found open in Tally. Open a company first.');
      return null;
    }

    // Use config company name if specified, else take first open one
    let selected;
    if (configCompany) {
      selected = companies.find(c => c.NAME === configCompany);
      if (!selected) {
        spinner.fail(`Company "${configCompany}" not found. Open companies: ${companies.map(c => c.NAME).join(', ')}`);
        return null;
      }
    } else {
      selected = companies[0];
    }

    spinner.succeed(`Using company: ${chalk.bold(selected.NAME)}`);
    return selected.NAME;
  } catch (e) {
    spinner.fail(`Company detection failed: ${e.message}`);
    throw e;
  }
}

// STEP 2: Extract all master collections
async function extractMasters(company) {
  const allGroups = [
    { label: 'Accounting Masters', items: ACCOUNTING_MASTERS },
    { label: 'Inventory Masters',  items: INVENTORY_MASTERS  },
    { label: 'Config Masters',     items: CONFIG_MASTERS     },
    { label: 'GST Masters',        items: GST_MASTERS        },
  ];

  console.log(chalk.cyan('\n Extracting masters...'));

  const results = {};

  for (const group of allGroups) {
    console.log(chalk.dim(`\n  ${group.label}`));

    for (const col of group.items) {
      const spinner = ora(`  ${col.name}`).start();
      try {
        const raw    = await withRetry(col.name,
          () => client.fetchCustomTDLCollection(
            `My${col.name}Coll`, col.tdlType, col.fields, company
          ),
          RETRY_ATTEMPTS, RETRY_DELAY
        );
        const parsed = await parseXML(raw);
        await saveJSON(OUTPUT_DIR, `master_${col.name}.json`, parsed);
        results[col.name] = { status: 'ok' };
        spinner.succeed(`  ${col.name}`);
      } catch (e) {
        spinner.fail(`  ${col.name} — ${chalk.red(e.message)}`);
        results[col.name] = { status: 'error', error: e.message };
      }
    }
  }

  return results;
}

//  STEP 3: Extract payroll masters (separate — needs Employee/PayHead types) 
async function extractPayrollMasters(company) {
  console.log(chalk.cyan('\n Extracting payroll masters...'));

  const results = {};

  for (const col of PAYROLL_MASTERS) {
    const spinner = ora(`  ${col.name}`).start();
    try {
      const raw    = await withRetry(col.name,
        () => client.fetchCustomTDLCollection(
          `My${col.name}Coll`, col.tdlType, col.fields, company
        ),
        RETRY_ATTEMPTS, RETRY_DELAY
      );
      const parsed = await parseXML(raw);
      await saveJSON(OUTPUT_DIR, `payroll_master_${col.name}.json`, parsed);
      results[col.name] = { status: 'ok' };
      spinner.succeed(`  ${col.name}`);
    } catch (e) {
      spinner.fail(`  ${col.name} — ${chalk.red(e.message)}`);
      results[col.name] = { status: 'error', error: e.message };
    }
  }

  return results;
}

// STEP 4: Extract accounting vouchers month-by-month 
async function extractVouchers(company, fromDate, toDate) {
  console.log(chalk.cyan('\nExtracting accounting vouchers...'));

  const months  = splitDateRangeByMonth(fromDate, toDate);
  const results = {};

  for (const vType of VOUCHER_TYPES) {
    const safeType = vType.toLowerCase().replace(/\s+/g, '_');
    results[safeType] = { months: {}, status: 'ok' };

    console.log(chalk.dim(`\n  ${vType} (${months.length} month chunks)`));

    const allChunks = [];

    for (const { from, to } of months) {
      const label   = `${vType} [${from}–${to}]`;
      const spinner = ora(`    ${label}`).start();

      try {
        const raw    = await withRetry(label,
          () => client.fetchVouchers(company, from, to, vType),
          RETRY_ATTEMPTS, RETRY_DELAY
        );
        const parsed = await parseXML(raw);
        const chunkKey = `voucher_${safeType}_${from}_${to}`;
        await saveJSON(OUTPUT_DIR, `${chunkKey}.json`, parsed);
        allChunks.push({ from, to, file: `${chunkKey}.json` });
        results[safeType].months[`${from}_${to}`] = 'ok';
        spinner.succeed(`    ${label}`);
      } catch (e) {
        spinner.fail(`    ${label} — ${chalk.red(e.message)}`);
        results[safeType].months[`${from}_${to}`] = `error: ${e.message}`;
        results[safeType].status = 'partial';
      }
    }

    // Save an index file listing all chunks for this voucher type
    await saveJSON(OUTPUT_DIR, `_index_voucher_${safeType}.json`, allChunks);
  }

  return results;
}

// ─── STEP 5: Extract payroll vouchers ─────────────────────────────────────────
async function extractPayrollVouchers(company, fromDate, toDate) {
  console.log(chalk.cyan('\n Extracting payroll vouchers...'));

  const months  = splitDateRangeByMonth(fromDate, toDate);
  const results = {};

  for (const vType of PAYROLL_VOUCHER_TYPES) {
    const safeType = vType.toLowerCase();
    results[safeType] = { months: {}, status: 'ok' };

    console.log(chalk.dim(`\n  ${vType} (${months.length} month chunks)`));

    const allChunks = [];

    for (const { from, to } of months) {
      const label   = `${vType} [${from}–${to}]`;
      const spinner = ora(`    ${label}`).start();

      try {
        const raw    = await withRetry(label,
          () => client.fetchVouchers(company, from, to, vType),
          RETRY_ATTEMPTS, RETRY_DELAY
        );
        const parsed = await parseXML(raw);
        const chunkKey = `payroll_voucher_${safeType}_${from}_${to}`;
        await saveJSON(OUTPUT_DIR, `${chunkKey}.json`, parsed);
        allChunks.push({ from, to, file: `${chunkKey}.json` });
        results[safeType].months[`${from}_${to}`] = 'ok';
        spinner.succeed(`    ${label}`);
      } catch (e) {
        spinner.fail(`    ${label} — ${chalk.red(e.message)}`);
        results[safeType].months[`${from}_${to}`] = `error: ${e.message}`;
        results[safeType].status = 'partial';
      }
    }

    await saveJSON(OUTPUT_DIR, `_index_payroll_voucher_${safeType}.json`, allChunks);
  }

  return results;
}

//  STEP 6: Extract financial reports
async function extractFinancialReports(company, fromDate, toDate) {
  console.log(chalk.cyan('\n Extracting financial reports...'));

  const results = {};

  for (const rpt of FINANCIAL_REPORTS) {
    const spinner = ora(`  ${rpt.name}`).start();
    try {
      const raw    = await withRetry(rpt.name,
        () => client.fetchReport(rpt.reportId, company, fromDate, toDate),
        RETRY_ATTEMPTS, RETRY_DELAY
      );
      const parsed = await parseXML(raw);
      await saveJSON(OUTPUT_DIR, `report_${rpt.name}.json`, parsed);
      results[rpt.name] = { status: 'ok' };
      spinner.succeed(`  ${rpt.name}`);
    } catch (e) {
      spinner.fail(`  ${rpt.name} — ${chalk.red(e.message)}`);
      results[rpt.name] = { status: 'error', error: e.message };
    }
  }

  return results;
}

// STEP 7: Save extraction summary
async function saveSummary(company, fromDate, toDate, allResults) {
  const summary = {
    extractedAt:  new Date().toISOString(),
    company,
    fromDate,
    toDate,
    outputDir:    OUTPUT_DIR,
    results:      allResults,
  };
  await saveJSON(OUTPUT_DIR, '_extraction_summary.json', summary);
  return summary;
}

// Main Run function
async function run(config) {
  OUTPUT_DIR     = config.outputDir;
  RETRY_ATTEMPTS = config.retryAttempts || 3;
  RETRY_DELAY    = config.retryDelayMs  || 2000;

  client.init(config.tally.host, config.tally.port);

  const startTime = Date.now();
  console.log(`  Port     : ${config.tally.host}:${config.tally.port}`);
  console.log(`  Date range: ${config.fromDate} → ${config.toDate}`);
  console.log(`  Output   : ${OUTPUT_DIR}\n`);

  // Ping
  const spinner = ora('Connecting to Tally...').start();
  const alive   = await client.ping();
  if (!alive) {
    spinner.fail('Cannot reach Tally. Is TallyPrime running with XML server enabled on port ' + config.tally.port + '?');
    process.exit(1);
  }
  spinner.succeed('Tally is running');

  // Detect company
  const company = await detectCompany(config.company);
  if (!company) process.exit(1);

  const allResults = {};

  // Run all steps
  allResults.accountingMasters  = await extractMasters(company);
  allResults.payrollMasters     = await extractPayrollMasters(company);
  allResults.accountingVouchers = await extractVouchers(company, config.fromDate, config.toDate);
  // allResults.payrollVouchers    = await extractPayrollVouchers(company, config.fromDate, config.toDate);
  allResults.financialReports   = await extractFinancialReports(company, config.fromDate, config.toDate);

  // Summary
  const summary = await saveSummary(company, config.fromDate, config.toDate, allResults);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);;
  console.log(`  Company  : ${company}`);
  console.log(`  Files in : ${OUTPUT_DIR}`);
  console.log(`  Time     : ${elapsed}s\n`);

  return summary;
}

module.exports = { run };
