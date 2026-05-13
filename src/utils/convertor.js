
// XML parsing, retry logic, file saving

const xml2js  = require('xml2js');
const fs      = require('fs-extra');
const path    = require('path');
const chalk   = require('chalk');

const parser = new xml2js.Parser({
  explicitArray: false,   // single items come as object, not 1-element array
  mergeAttrs:    true,    // merge XML attributes into the JS object
  trim:          true,
});

// XML Parsing
async function parseXML(rawXml) {
  try {
    return await parser.parseStringPromise(rawXml);
  } catch (e) {
    throw new Error(`XML parse failed: ${e.message}\nRaw (first 300 chars): ${String(rawXml).slice(0, 300)}`);
  }
}

// Save parsed data to a JSON file
async function saveJSON(outputDir, filename, data) {
  await fs.ensureDir(outputDir);
  const filepath = path.join(outputDir, filename);
  await fs.writeJSON(filepath, data, { spaces: 2 });
  return filepath;
}

// Retry wrapper — retries on network/timeout errors
async function withRetry(label, fn, attempts = 3, delayMs = 2000) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === attempts) throw e;
      console.log(chalk.yellow(`  ⟳  Retry ${i}/${attempts - 1} for "${label}": ${e.message}`));
      await new Promise(r => setTimeout(r, delayMs * i));
    }
  }
}

// Split a date range into monthly chunks
// Prevents Tally from timing out on large voucher datasets
function splitDateRangeByMonth(fromDate, toDate) {
  // fromDate / toDate format: YYYYMMDD
  const chunks = [];
  let cur = new Date(`${fromDate.slice(0,4)}-${fromDate.slice(4,6)}-${fromDate.slice(6,8)}`);
  const end = new Date(`${toDate.slice(0,4)}-${toDate.slice(4,6)}-${toDate.slice(6,8)}`);

  while (cur <= end) {
    const monthEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0); // last day of month
    const chunkEnd = monthEnd < end ? monthEnd : end;

    chunks.push({
      from: formatDate(cur),
      to:   formatDate(chunkEnd),
    });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1); // first of next month
  }
  return chunks;
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

//Extract array from parsed XML (handles both array and single object)
function toArray(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

module.exports = { parseXML, saveJSON, withRetry, splitDateRangeByMonth, toArray };
