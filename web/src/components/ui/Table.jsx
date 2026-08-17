import "./Table.css";
import { SkeletonLines } from "./Skeleton.jsx";

export function DataTable({ columns, rows, onRowClick, loading = false, emptyMessage = "Nenhum registro encontrado." }) {
  if (loading) {
    return (
      <div className="data-table-loading">
        <SkeletonLines count={5} />
      </div>
    );
  }

  if (!rows.length) {
    return <p className="data-table-empty">{emptyMessage}</p>;
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={onRowClick ? "clickable" : ""}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} data-label={col.label}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
