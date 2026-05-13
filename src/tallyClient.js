const axios = require('axios');
const {escapeXML, buildEnvelope} = require('./utils/helper')
let TALLY_URL = 'http://localhost:9000';

function init(host = 'localhost', port = 9000) {
  TALLY_URL = `http://${host}:${port}`;
}

function normalizeXMLValue(value) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return normalizeXMLValue(value[0]);
  }

  if (value && typeof value === 'object') {
    if ('_' in value) {
      return normalizeXMLValue(value._);
    }
  }

  return String(value || '').trim();
}

function normalizeCompanyName(companyName) {
  const normalized = normalizeXMLValue(companyName);

  if (!normalized) {
    throw new Error('Invalid company name');
  }

  return normalized;
}


function buildFetchXML(fields = []) {
  return fields
    .map(field => `<FETCH>${escapeXML(field)}</FETCH>`)
    .join('\n');
}

async function post(xml) {
  try {
    const response = await axios.post(TALLY_URL, xml, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
      },
      responseType: 'text',
      timeout: 120000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    return response.data;
  } catch (err) {
    if (err.response) {
      throw new Error(
        `Tally HTTP ${err.response.status}\n${String(err.response.data).slice(0, 1000)}`
      );
    }

    if (err.request) {
      throw new Error(`Cannot connect to Tally at ${TALLY_URL}`);
    }

    throw err;
  }
}

async function ping() {
  try {
    await axios.get(TALLY_URL, { timeout: 5000 });
    return true;
  } catch (e) {
    if (e.response) return true;
    return false;
  }
}

async function getOpenCompanies() {
  const xml = buildEnvelope(
    `
<HEADER>
  <VERSION>1</VERSION>
  <TALLYREQUEST>Export</TALLYREQUEST>
  <TYPE>Collection</TYPE>
  <ID>List of Companies</ID>
</HEADER>
`,
    `
<BODY>
  <DESC>
    <STATICVARIABLES>
      <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
    </STATICVARIABLES>
  </DESC>
</BODY>
`
  );

  return post(xml);
}

async function fetchStandardCollection(
  collectionType,
  companyName,
  fields = []
) {
  const normalizedCompany = normalizeCompanyName(companyName);
  const safeCollectionType = normalizeXMLValue(collectionType);
  const safeCompany = escapeXML(normalizedCompany);
  const collectionName = `My${safeCollectionType.replace(/\s+/g, '')}Coll`;
  const fetchXML = buildFetchXML(fields);
  const xml = buildEnvelope(
    `
<HEADER>
  <VERSION>1</VERSION>
  <TALLYREQUEST>Export</TALLYREQUEST>
  <TYPE>Collection</TYPE>
  <ID>${collectionName}</ID>
</HEADER>
`,
    `
<BODY>
  <DESC>
    <STATICVARIABLES>
      <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      <SVCURRENTCOMPANY>${safeCompany}</SVCURRENTCOMPANY>
    </STATICVARIABLES>
    <TDL>
      <TDLMESSAGE>
        <COLLECTION NAME="${collectionName}">
          <TYPE>${safeCollectionType}</TYPE>
          ${fetchXML}
        </COLLECTION>
      </TDLMESSAGE>
    </TDL>

  </DESC>
</BODY>
`
  );

  return post(xml);
}

async function fetchVouchers(
  companyName,
  fromDate,
  toDate,
  voucherType = ''
) {
  const normalizedCompany = normalizeCompanyName(companyName);
  const safeCompany = escapeXML(normalizedCompany);
  const voucherFilter = voucherType
    ? `<SVVOUCHERTYPE>${escapeXML(voucherType)}</SVVOUCHERTYPE>`
    : '';
  const xml = buildEnvelope(
    `
<HEADER>
  <VERSION>1</VERSION>
  <TALLYREQUEST>Export</TALLYREQUEST>
  <TYPE>Data</TYPE>
  <ID>Day Book</ID>
</HEADER>
`,
    `
<BODY>
  <DESC>
    <STATICVARIABLES>
      <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      <SVCURRENTCOMPANY>${safeCompany}</SVCURRENTCOMPANY>
      <SVFROMDATE TYPE="Date">${fromDate}</SVFROMDATE>
      <SVTODATE TYPE="Date">${toDate}</SVTODATE>
      <EXPLODEFLAG>Yes</EXPLODEFLAG>
      ${voucherFilter}
    </STATICVARIABLES>
  </DESC>
</BODY>
`
  );
  return post(xml);
}

async function fetchCustomTDLCollection(
  collectionName,
  tdlType,
  fields = [],
  companyName,
  extraFilters = ''
) {
  const normalizedCompany = normalizeCompanyName(companyName);
  const safeCollectionName = escapeXML(
    normalizeXMLValue(collectionName)
  );
  const safeTDLType = normalizeXMLValue(tdlType);
  const safeCompany = escapeXML(normalizedCompany);
  const fetchXML = buildFetchXML(fields);
  const xml = buildEnvelope(
    `
<HEADER>
  <VERSION>1</VERSION>
  <TALLYREQUEST>Export</TALLYREQUEST>
  <TYPE>Collection</TYPE>
  <ID>${safeCollectionName}</ID>
</HEADER>
`,
    `
<BODY>
  <DESC>
    <STATICVARIABLES>
      <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      <SVCURRENTCOMPANY>${safeCompany}</SVCURRENTCOMPANY>
    </STATICVARIABLES>
    <TDL>
      <TDLMESSAGE>
        <COLLECTION NAME="${safeCollectionName}">
          <TYPE>${safeTDLType}</TYPE>
          ${fetchXML}
          ${extraFilters || ''}
        </COLLECTION>
      </TDLMESSAGE>
    </TDL>
  </DESC>
</BODY>
`
  );
  return post(xml);
}

async function fetchReport(
  reportName,
  companyName,
  fromDate,
  toDate
) {
  const normalizedCompany = normalizeCompanyName(companyName);
  const safeReport = escapeXML(
    normalizeXMLValue(reportName)
  );

  const safeCompany = escapeXML(normalizedCompany);
  const xml = buildEnvelope(
    `
<HEADER>
  <VERSION>1</VERSION>
  <TALLYREQUEST>Export</TALLYREQUEST>
  <TYPE>Data</TYPE>
  <ID>${safeReport}</ID>
</HEADER>
`,
    `
<BODY>
  <DESC>
    <STATICVARIABLES>
      <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      <SVCURRENTCOMPANY>${safeCompany}</SVCURRENTCOMPANY>
      <SVFROMDATE TYPE="Date">${fromDate}</SVFROMDATE>
      <SVTODATE TYPE="Date">${toDate}</SVTODATE>
      <EXPLODEFLAG>Yes</EXPLODEFLAG>
    </STATICVARIABLES>
  </DESC>
</BODY>
`
  );
  return post(xml);
}

module.exports = {
  init,
  ping,
  post,
  escapeXML,
  normalizeXMLValue,
  normalizeCompanyName,
  getOpenCompanies,
  fetchStandardCollection,
  fetchVouchers,
  fetchCustomTDLCollection,
  fetchReport,
};