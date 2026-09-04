const escapeCell = (value) => {
  if (value === null || value === undefined) return '';
  let text = String(value);
  // Evita execução de fórmulas quando o CSV é aberto no Excel/LibreOffice.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const exportRowsToCsv = (rows, filename) => {
  if (!Array.isArray(rows) || rows.length === 0) return false;

  const csv = serializeRowsToCsv(rows);
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace(/\.xlsx$/i, '.csv');
  link.click();
  URL.revokeObjectURL(url);
  return true;
};

export const serializeRowsToCsv = (rows) => {
  const headers = [...new Set(rows.flatMap(row => Object.keys(row)))];
  const lines = [
    headers.map(escapeCell).join(';'),
    ...rows.map(row => headers.map(header => escapeCell(row[header])).join(';'))
  ];
  return lines.join('\r\n');
};
