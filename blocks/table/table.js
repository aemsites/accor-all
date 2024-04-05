/*
 * Table Block
 * Recreate a table
 * https://www.hlx.live/developer/block-collection/table
 */

function buildCell(rowIndex) {
  const cell = rowIndex ? document.createElement('td') : document.createElement('th');
  if (!rowIndex) cell.setAttribute('scope', 'col');
  return cell;
}

export default async function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  const header = !block.classList.contains('no-header');
  if (header) {
    table.append(thead);
  }
  table.append(tbody);

  [...block.children].forEach((child, i) => {
    const row = document.createElement('tr');
    if (header && i === 0) thead.append(row);
    else tbody.append(row);
    [...child.children].forEach((col) => {
      const cell = buildCell(header ? i : i + 1);
      cell.innerHTML = col.innerHTML;
      row.append(cell);
    });
  });

  const colCount = header ? thead.querySelectorAll('tr > th').length : tbody.querySelectorAll('tr:first-child > td').length;
  let prevRow;
  tbody.querySelectorAll('tr').forEach((tr) => {
    const cols = tr.querySelectorAll('td').length;
    if (prevRow && (cols < colCount)) {
      const diff = colCount - cols;
      prevRow.querySelectorAll('td').forEach((td, i) => {
        if (i >= (colCount - diff)) {
          td.setAttribute('rowspan', 2);
        }
      });
    }
    prevRow = tr;
  });
  block.innerHTML = '';
  block.append(table);
}
