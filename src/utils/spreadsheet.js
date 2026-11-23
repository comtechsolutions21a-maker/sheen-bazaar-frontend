// Read and write simple spreadsheets in the browser, no extra packages:
//  • CSV (any spreadsheet app can save as CSV)
//  • Excel .xlsx — unzipped with the browser's built-in DecompressionStream,
//    reading the first sheet only.

// ── CSV ──
export function parseCSV(text) {
  text = String(text || '').replace(/^﻿/, '');
  // Excel in some regions saves with ";" — use whichever separator the header row has more of
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const sep = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => String(x).trim() !== ''));
}

export function toCSV(rows) {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n');
}

export function downloadFile(name, content, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// ── XLSX (first sheet) ──
async function inflateRaw(bytes) {
  const ds = new DecompressionStream('deflate-raw');
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unzip(buf) {
  const u8 = new Uint8Array(buf);
  const dv = new DataView(buf);
  // End of central directory record
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 66000); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('This file is not a valid Excel (.xlsx) file');
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const files = {};
  const dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const local = dv.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nameLen));
    files[name] = { method, csize, local };
    p += 46 + nameLen + extraLen + commentLen;
  }
  return {
    has: (name) => !!files[name],
    async text(name) {
      const f = files[name];
      if (!f) return null;
      const lnameLen = dv.getUint16(f.local + 26, true);
      const lextraLen = dv.getUint16(f.local + 28, true);
      const start = f.local + 30 + lnameLen + lextraLen;
      const data = u8.subarray(start, start + f.csize);
      const out = f.method === 0 ? data : await inflateRaw(data);
      return dec.decode(out);
    },
  };
}

const colIndex = (ref) => {
  const letters = String(ref).replace(/\d+/g, '');
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

export async function parseXLSX(file) {
  if (typeof DecompressionStream === 'undefined') throw new Error('This browser can\'t read Excel files. Please save the sheet as CSV and upload that.');
  const zip = await unzip(await file.arrayBuffer());
  const xml = (s) => new DOMParser().parseFromString(s, 'application/xml');

  // Shared strings
  const shared = [];
  const ss = await zip.text('xl/sharedStrings.xml');
  if (ss) xml(ss).querySelectorAll('si').forEach((si) => shared.push([...si.getElementsByTagName('t')].map((t) => t.textContent).join('')));

  // First sheet in the workbook
  let sheetPath = 'xl/worksheets/sheet1.xml';
  const wb = await zip.text('xl/workbook.xml');
  const rels = await zip.text('xl/_rels/workbook.xml.rels');
  if (wb && rels) {
    const first = xml(wb).getElementsByTagName('sheet')[0];
    const rid = first?.getAttribute('r:id') || first?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
    const rel = [...xml(rels).getElementsByTagName('Relationship')].find((r) => r.getAttribute('Id') === rid);
    if (rel) {
      const target = rel.getAttribute('Target').replace(/^\//, '');
      sheetPath = target.startsWith('xl/') ? target : `xl/${target}`;
    }
  }
  const sheet = await zip.text(sheetPath);
  if (!sheet) throw new Error('Could not find the first sheet in this Excel file');

  // Date-formatted cells: find which style ids are dates
  const dateStyles = new Set();
  const styles = await zip.text('xl/styles.xml');
  if (styles) {
    const doc = xml(styles);
    const custom = new Map([...doc.getElementsByTagName('numFmt')].map((f) => [f.getAttribute('numFmtId'), f.getAttribute('formatCode') || '']));
    const xfs = doc.getElementsByTagName('cellXfs')[0];
    if (xfs) [...xfs.getElementsByTagName('xf')].forEach((xf, i) => {
      const id = Number(xf.getAttribute('numFmtId'));
      const code = custom.get(String(id)) || '';
      if ((id >= 14 && id <= 22) || (/[dy]/i.test(code) && !/[#0]/.test(code.replace(/"[^"]*"/g, '')))) dateStyles.add(String(i));
    });
  }
  const excelDate = (n) => {
    const d = new Date(Math.round((Number(n) - 25569) * 86400000));
    const p = (x) => String(x).padStart(2, '0');
    const hasTime = Number(n) % 1 !== 0;
    return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}${hasTime ? ` ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}` : ''}`;
  };

  const rows = [];
  xml(sheet).querySelectorAll('sheetData > row').forEach((r) => {
    const out = [];
    r.querySelectorAll('c').forEach((c) => {
      const idx = colIndex(c.getAttribute('r') || '');
      const t = c.getAttribute('t');
      const v = c.getElementsByTagName('v')[0]?.textContent ?? '';
      let val;
      if (t === 's') val = shared[Number(v)] ?? '';
      else if (t === 'inlineStr') val = [...c.getElementsByTagName('t')].map((x) => x.textContent).join('');
      else if (t === 'b') val = v === '1' ? 'TRUE' : 'FALSE';
      else if (v !== '' && dateStyles.has(c.getAttribute('s'))) val = excelDate(v);
      else val = v;
      out[idx >= 0 ? idx : out.length] = val;
    });
    rows.push(Array.from(out, (x) => (x == null ? '' : String(x))));
  });
  return rows.filter((r) => r.some((x) => String(x).trim() !== ''));
}

export async function readSpreadsheet(file) {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.xlsx')) return parseXLSX(file);
  if (name.endsWith('.xls')) throw new Error('Old .xls files aren\'t supported. In Excel choose File → Save As → Excel Workbook (.xlsx) or CSV.');
  return parseCSV(await file.text());
}
