import { useState, useMemo } from 'react';
import {
  Grid, Column, Tile,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch,
  Pagination, Tag, Select, SelectItem,
} from '@carbon/react';
import type { Decision } from '../types';

interface Props {
  decisions: Decision[];
}

export function TradesPage({ decisions }: Props) {
  const [timeframe, setTimeframe] = useState('today');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);

  // Filter to exit decisions with P&L
  const exits = useMemo(() => {
    const exitTypes = new Set([
      'TARGET_HIT', 'STOP_LOSS', 'TRAILING_SL', 'TIME_EXIT', 'EXIT',
      'MARKET_CLOSE', 'MANUAL_SQUARE_OFF', 'REJECTION', 'SYSTEM_STOP', 'MIS_SQUARE_OFF',
    ]);
    let filtered = decisions
      .filter(d => exitTypes.has(d.decision_type?.toUpperCase() ?? '') && d.net_pnl != null);
    if (timeframe === 'today') {
      const today = new Date().toISOString().slice(0, 10);
      filtered = filtered.filter(d => d.timestamp?.startsWith(today));
    }
    return filtered.reverse();
  }, [decisions, timeframe]);

  // Stats
  const stats = useMemo(() => {
    const wins = exits.filter(d => (d.net_pnl ?? 0) > 0);
    const losses = exits.filter(d => (d.net_pnl ?? 0) < 0);
    const totalPnl = exits.reduce((sum, d) => sum + (d.net_pnl ?? 0), 0);
    const deployed = exits.reduce((sum, d) => sum + (d.total_costs ?? 0), 0) + exits.reduce((sum, d) => sum + Math.abs(d.pnl ?? 0), 0);
    return {
      totalPnl,
      count: exits.length,
      wins: wins.length,
      losses: losses.length,
      winRate: exits.length ? ((wins.length / exits.length) * 100).toFixed(1) : '0',
      avgReturn: exits.length ? (totalPnl / exits.length) : 0,
      deployed: deployed || (exits.length * 5000), // fallback estimate
    };
  }, [exits]);

  // Filtered for search
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
    date: d.timestamp?.slice(0, 10) ?? '--',
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
    held: d.hold_minutes != null ? `${d.hold_minutes}m` : '—',
    reasoning: d.reasoning ?? '',
    highest: d.highest_premium,
    lowest: d.lowest_premium,
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

  const TAG_COLORS: Record<string, 'green' | 'red' | 'blue' | 'purple' | 'warm-gray' | 'gray'> = {
    TARGET_HIT: 'green', STOP_LOSS: 'red', REJECTION: 'red',
    TRAILING_SL: 'purple', TIME_EXIT: 'blue', EXIT: 'blue',
    MANUAL_SQUARE_OFF: 'warm-gray', MIS_SQUARE_OFF: 'warm-gray',
    MARKET_CLOSE: 'warm-gray', SYSTEM_STOP: 'gray',
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--cds-spacing-05) var(--cds-spacing-06) 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--cds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Trade History
          </h3>
          <Select id="timeframe" size="sm" value={timeframe} onChange={(e) => { setTimeframe(e.target.value); setPage(0); }}>
            <SelectItem value="today" text="Today Only" />
            <SelectItem value="all" text="All Time" />
          </Select>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-placeholder)' }}>
          {stats.count} trades · {stats.wins}W – {stats.losses}L
        </span>
      </div>

      {/* Stats Bar */}
      <Grid narrow style={{ padding: 'var(--cds-spacing-05) var(--cds-spacing-06)' }}>
        <Column sm={2} md={2} lg={3}>
          <Tile className="metric-tile">
            <span className="metric-label">Net P&amp;L</span>
            <span className={`metric-value ${stats.totalPnl > 0 ? 'text-green' : stats.totalPnl < 0 ? 'text-red' : ''}`}>
              {stats.totalPnl >= 0 ? '+' : ''}₹{Math.abs(stats.totalPnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="metric-sub">{stats.count} trades</span>
          </Tile>
        </Column>
        <Column sm={2} md={2} lg={3}>
          <Tile className="metric-tile">
            <span className="metric-label">Win Rate</span>
            <span className="metric-value">{stats.winRate}%</span>
            <span className="metric-sub">{stats.wins}W – {stats.losses}L</span>
          </Tile>
        </Column>
        <Column sm={2} md={2} lg={3}>
          <Tile className="metric-tile">
            <span className="metric-label">Avg Return</span>
            <span className={`metric-value ${stats.avgReturn > 0 ? 'text-green' : stats.avgReturn < 0 ? 'text-red' : ''}`}>
              {stats.avgReturn >= 0 ? '+' : ''}₹{Math.abs(stats.avgReturn).toFixed(2)}
            </span>
            <span className="metric-sub">per trade</span>
          </Tile>
        </Column>
        <Column sm={2} md={2} lg={3}>
          <Tile className="metric-tile">
            <span className="metric-label">Capital Deployed</span>
            <span className="metric-value">₹{stats.deployed.toLocaleString('en-IN')}</span>
            <span className="metric-sub">total investment</span>
          </Tile>
        </Column>
      </Grid>

      {/* Trade Table */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '0 var(--cds-spacing-06) var(--cds-spacing-06)' }}>
        <DataTable rows={paginated} headers={headers} isSortable>
          {({ rows: tableRows, headers: tableHeaders, getTableProps, getHeaderProps, getRowProps, getToolbarProps }) => (
            <TableContainer title="" description="" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <TableToolbar {...getToolbarProps()}>
                <TableToolbarContent>
                  <TableToolbarSearch onChange={(_e, val) => setSearch(val ?? '')} placeholder="Filter by symbol or exit type..." />
                </TableToolbarContent>
              </TableToolbar>
              <div style={{ flex: 1, overflow: 'auto' }}>
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
                    {tableRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={headers.length} style={{ textAlign: 'center', color: 'var(--cds-text-placeholder)', padding: 32 }}>
                          {exits.length === 0 ? 'No trades recorded yet' : 'No matching trades'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      tableRows.map(row => {
                        const rowData = rows.find(r => r.id === row.id);
                        return (
                          <TableRow {...getRowProps({ row })} key={row.id}>
                            {row.cells.map(cell => {
                              if (cell.info.header === 'netDisplay') {
                                const net = rowData?.net ?? 0;
                                return (
                                  <TableCell key={cell.id} style={{ fontVariantNumeric: 'tabular-nums' }}>
                                    <span className={net >= 0 ? 'text-green' : 'text-red'} style={{ fontWeight: 600 }}>
                                      {cell.value}
                                    </span>
                                  </TableCell>
                                );
                              }
                              if (cell.info.header === 'type') {
                                const t = cell.value as string;
                                const tagType = TAG_COLORS[t] ?? 'gray';
                                return (
                                  <TableCell key={cell.id}>
                                    <Tag type={tagType} size="sm">{t}</Tag>
                                  </TableCell>
                                );
                              }
                              return (
                                <TableCell key={cell.id} style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.8rem' }}>
                                  {cell.value}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TableContainer>
          )}
        </DataTable>
      </div>

      <div style={{ padding: '0 var(--cds-spacing-06) var(--cds-spacing-04)' }}>
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
