import { useState, useMemo } from 'react';
import {
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Pagination,
  Tag,
} from '@carbon/react';
import type { Decision } from '../types';

interface Props {
  decisions: Decision[];
}

export function TradesPage({ decisions }: Props) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);

  // Only exit decisions with P&L
  const exits = useMemo(() => {
    const exitTypes = new Set([
      'TARGET_HIT', 'STOP_LOSS', 'TRAILING_SL', 'TIME_EXIT', 'EXIT',
      'MARKET_CLOSE', 'MANUAL_SQUARE_OFF', 'REJECTION', 'SYSTEM_STOP', 'MIS_SQUARE_OFF',
    ]);
    return decisions
      .filter(d => exitTypes.has(d.decision_type?.toUpperCase() ?? '') && d.net_pnl != null)
      .slice(-200)
      .reverse();
  }, [decisions]);

  const filtered = useMemo(() => {
    if (!search) return exits;
    const q = search.toLowerCase();
    return exits.filter(d =>
      (d.option_symbol ?? '').toLowerCase().includes(q) ||
      d.decision_type?.toLowerCase().includes(q) ||
      (d.underlying ?? '').toLowerCase().includes(q)
    );
  }, [exits, search]);

  const rows = filtered.map((d, i) => ({
    id: String(i),
    time: d.timestamp?.slice(11, 19) ?? '--:--',
    symbol: d.option_symbol
      ? `${d.underlying ?? ''} ${d.option_strike ?? ''}${d.option_type ?? ''}`
      : '—',
    type: d.decision_type ?? '—',
    entry: d.entry_price != null ? `₹${d.entry_price.toFixed(0)}` : '—',
    exit: d.exit_price != null ? `₹${d.exit_price.toFixed(0)}` : '—',
    qty: d.quantity ?? 0,
    gross: d.pnl != null ? `₹${d.pnl.toFixed(2)}` : '—',
    costs: d.total_costs != null ? `₹${d.total_costs.toFixed(2)}` : '—',
    net: d.net_pnl != null ? d.net_pnl : 0,
    netDisplay: d.net_pnl != null
      ? `${d.net_pnl >= 0 ? '+' : ''}₹${d.net_pnl.toFixed(2)}`
      : '—',
    netPositive: d.net_pnl != null ? d.net_pnl >= 0 : false,
    held: d.hold_minutes != null ? `${d.hold_minutes}m` : '—',
    reasoning: d.reasoning ?? '',
  }));

  const headers = [
    { key: 'time', header: 'Time' },
    { key: 'symbol', header: 'Symbol' },
    { key: 'type', header: 'Exit' },
    { key: 'qty', header: 'Qty' },
    { key: 'entry', header: 'Entry' },
    { key: 'exit', header: 'Exit' },
    { key: 'netDisplay', header: 'Net P&L' },
    { key: 'held', header: 'Held' },
    { key: 'reasoning', header: 'Reason' },
  ];

  const paginated = rows.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="h-full flex flex-col p-4">
      <DataTable rows={paginated} headers={headers} isSortable>
        {({ rows: tableRows, headers: tableHeaders, getTableProps, getHeaderProps, getRowProps, getToolbarProps }) => (
          <TableContainer title="Trade History" description={filtered.length === 0 ? 'No trades recorded yet' : `${filtered.length} trades`}>
            <TableToolbar {...getToolbarProps()}>
              <TableToolbarContent>
                <TableToolbarSearch onChange={(_e, val) => setSearch(val ?? '')} placeholder="Filter trades..." />
              </TableToolbarContent>
            </TableToolbar>
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {tableHeaders.map(h => (
                    <TableHeader {...getHeaderProps({ header: h })} key={h.key}>
                      {h.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.map(row => (
                  <TableRow {...getRowProps({ row })} key={row.id}>
                    {row.cells.map(cell => {
                      if (cell.info.header === 'netDisplay') {
                        const net = rows.find(r => r.id === row.id)?.net ?? 0;
                        return (
                          <TableCell key={cell.id} className="tabular-nums">
                            <span className={net >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                              {cell.value}
                            </span>
                          </TableCell>
                        );
                      }
                      if (cell.info.header === 'type') {
                        const t = cell.value as string;
                        const tagType = t === 'TARGET_HIT' ? 'green' : t === 'STOP_LOSS' || t === 'REJECTION' ? 'red' : t === 'TRAILING_SL' ? 'purple' : 'gray';
                        return (
                          <TableCell key={cell.id}>
                            <Tag type={tagType} size="sm">{t}</Tag>
                          </TableCell>
                        );
                      }
                      return <TableCell key={cell.id} className="tabular-nums text-xs">{cell.value}</TableCell>;
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
      <div className="mt-auto pt-2">
        <Pagination
          backwardText="Prev"
          forwardText="Next"
          itemsPerPageText="Trades per page:"
          page={page + 1}
          pageNumberText="Page"
          pageSize={pageSize}
          pageSizes={[10, 15, 25, 50]}
          totalItems={filtered.length}
          onChange={({ page: newPage, pageSize: newSize }) => {
            setPage((newPage ?? 1) - 1);
            setPageSize(newSize ?? 15);
          }}
        />
      </div>
    </div>
  );
}
