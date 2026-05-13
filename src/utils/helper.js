
function escapeXML(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildEnvelope(header, body) {
  return `<ENVELOPE>\n${header}\n${body}\n</ENVELOPE>`.trim();
}

function buildFetchXML(fields = []) {
  return fields.map(field => `<FETCH>${escapeXML(field)}</FETCH>`).join('\n');
}

function normalizeXMLValue(value) {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value))      return normalizeXMLValue(value[0]);
  if (value && typeof value === 'object' && '_' in value) return normalizeXMLValue(value._);
  return String(value || '').trim();
}

module.exports = { escapeXML, buildEnvelope, buildFetchXML, normalizeXMLValue };