import { useEffect, useRef } from 'react';
import {
  Grid, Column,
  Tile,
  StructuredListWrapper, StructuredListBody, StructuredListRow, StructuredListCell,
  Tag,
  SkeletonText,
} from '@carbon/react';
import type { Decision, EnigmaState } from '../types';

const TAG_MAP: Record<string, { type: 'green' | 'red' | 'blue' | 'purple' | 'warm-gray' | 'gray'; label: string }> = {
  ENTRY: { type: 'green', label: 'BUY' },
  TARGET_HIT: { type: 'green', label: 'TARGET' },
  STOP_LOSS: { type: 'red', label: 'STOP LOSS' },
  TRAILING_SL: { type: 'purple', label: 'TRAIL SL' },
  REJECTION: { type: 'red', label: 'REJECT' },
  TIME_EXIT: { type: 'blue', label: 'TIME EXIT' },
  MANUAL_SQUARE_OFF: { type: 'warm-gray', label: 'MANUAL SQ' },
  MIS_SQUARE_OFF: { type: 'warm-gray', label: 'MIS SQ' },
  PAUSE: { type: 'warm-gray', label: 'PAUSE' },
  SYSTEM_START: { type: 'gray', label: 'START' },
  SYSTEM_STOP: { type: 'gray', label: 'STOP' },
  PARAM_ADJUST: { type: 'purple', label: 'ADJUST' },
};

interface Props {
  state: EnigmaState | null;
  decisions: Decision[];
}

export function MonitorPage({ state, decisions }: Props) {
  const feedRef = useRef<HTMLDivElement>(null);
  const prevLen = useRef(decisions.length);

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (atBottom || decisions.length > prevLen.current) {
      el.scrollTop = el.scrollHeight;
    }
    prevLen.current = decisions.length;
  }, [decisions.length]);

  const pnl = state?.net_daily_pnl ?? 0;
  const dailyPnl = state?.daily_pnl ?? 0;
  const costs = state?.daily_costs ?? 0;

  return (
    <div className="enigma-monitor">
      {/* Key metrics tile strip */}
      <Grid narrow style={{ padding: 'var(--cds-spacing-05)' }}>
        <Column sm={2} md={2} lg={4}>
          <Tile className="metric-tile">
            <span className="metric-label">Net P&amp;L</span>
            <span className={`metric-value ${pnl > 0 ? 'text-green' : pnl < 0 ? 'text-red' : 'text-secondary'}`}>
              {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="metric-sub">Gross: ₹{dailyPnl.toFixed(0)} · Costs: ₹{costs.toFixed(0)}</span>
          </Tile>
        </Column>
        <Column sm={2} md={2} lg={2}>
          <Tile className="metric-tile">
            <span className="metric-label">Trades</span>
            <span className="metric-value">{state?.trades_today ?? 0} / {state?.params?.max_trades_per_day ?? 20}</span>
            <span className="metric-sub">Today</span>
          </Tile>
        </Column>
        <Column sm={2} md={2} lg={3}>
          <Tile className="metric-tile">
            <span className="metric-label">NIFTY Spot</span>
            <span className="metric-value">{state?.last_spot?.toLocaleString('en-IN') ?? '—'}</span>
            <span className="metric-sub">
              {state?.price_trend ?? '—'} · {state?.regime ?? '—'} · VIX {state?.vix?.toFixed(1) ?? '—'}
            </span>
          </Tile>
        </Column>
        <Column sm={2} md={2} lg={3}>
          <Tile className="metric-tile">
            <span className="metric-label">Capital</span>
            <span className="metric-value">₹{(state?.capital ?? 0).toLocaleString('en-IN')}</span>
            <span className="metric-sub">{state?.live_status ?? '⏳ Loading...'}</span>
          </Tile>
        </Column>
      </Grid>

      {/* Main content: feed + position */}
      <Grid narrow style={{ padding: '0 var(--cds-spacing-05)' }}>
        {/* LEFT: Decision Feed */}
        <Column sm={4} md={4} lg={12}>
          <Tile className="feed-tile">
            <div className="feed-header">
              <span>Mechanical Decision Feed</span>
              <Tag type="gray" size="sm">{decisions.length} events</Tag>
            </div>

            <div ref={feedRef} className="feed-scroll" style={{ maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
              {decisions.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center' }}>
                  {state ? (
                    <span style={{ color: 'var(--cds-text-secondary)' }}>Waiting for trading decisions...</span>
                  ) : (
                    <div style={{ width: '60%', margin: '0 auto' }}>
                      <SkeletonText paragraph lineCount={3} />
                    </div>
                  )}
                </div>
              ) : (
                <StructuredListWrapper isCondensed>
                  <StructuredListBody>
                    {decisions.slice(-60).reverse().map((d, i) => {
                      const dt = d.decision_type?.toUpperCase() ?? 'INFO';
                      const tag = TAG_MAP[dt] ?? { type: 'gray' as const, label: dt };
                      const ts = d.timestamp?.slice(11, 19) ?? '--:--';
                      const sym = d.option_symbol
                        ? `${d.underlying ?? ''} ${d.option_strike ?? ''}${d.option_type ?? ''}`
                        : '';
                      const pnlVal = d.net_pnl;

                      return (
                        <StructuredListRow key={i} className={`feed-row ${dt === 'ENTRY' ? 'row-entry' : dt === 'STOP_LOSS' ? 'row-loss' : ''}`}>
                          <StructuredListCell noWrap style={{ width: 70 }}>
                            <span style={{ color: 'var(--cds-text-secondary)', fontFamily: 'monospace' }}>{ts}</span>
                          </StructuredListCell>
                          <StructuredListCell noWrap style={{ width: 90 }}>
                            <Tag type={tag.type} size="sm">{tag.label}</Tag>
                          </StructuredListCell>
                          <StructuredListCell>
                            <span style={{ fontWeight: 600 }}>{sym}</span>
                            {d.entry_price != null && (
                              <span style={{ color: 'var(--cds-text-secondary)', marginLeft: 8, fontSize: '0.85em' }}>
                                @₹{d.entry_price.toFixed(0)}{d.quantity ? ` ×${d.quantity}` : ''}
                              </span>
                            )}
                          </StructuredListCell>
                          {pnlVal != null && (
                            <StructuredListCell noWrap style={{ textAlign: 'right', width: 100 }}>
                              <span className={`${pnlVal >= 0 ? 'text-green' : 'text-red'}`} style={{ fontWeight: 600 }}>
                                {pnlVal >= 0 ? '+' : ''}₹{pnlVal.toFixed(2)}
                              </span>
                            </StructuredListCell>
                          )}
                        </StructuredListRow>
                      );
                    })}
                  </StructuredListBody>
                </StructuredListWrapper>
              )}
            </div>
          </Tile>
        </Column>

        {/* RIGHT: Position Card */}
        <Column sm={4} md={4} lg={4}>
          <Tile className="position-tile">
            <h4 style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cds-text-secondary)', marginBottom: 'var(--cds-spacing-05)' }}>
              Active Position
            </h4>
            {state?.position ? (
              <StructuredListWrapper isCondensed>
                <StructuredListBody>
                  <StructuredListRow>
                    <StructuredListCell noWrap>Symbol</StructuredListCell>
                    <StructuredListCell>{state.position.contract.symbol}</StructuredListCell>
                  </StructuredListRow>
                  <StructuredListRow>
                    <StructuredListCell noWrap>Quantity</StructuredListCell>
                    <StructuredListCell>{state.position.quantity}</StructuredListCell>
                  </StructuredListRow>
                  <StructuredListRow>
                    <StructuredListCell noWrap>Entry</StructuredListCell>
                    <StructuredListCell>₹{state.position.entry_premium.toFixed(2)}</StructuredListCell>
                  </StructuredListRow>
                  <StructuredListRow>
                    <StructuredListCell noWrap>Current</StructuredListCell>
                    <StructuredListCell>₹{state.position.current_premium.toFixed(2)}</StructuredListCell>
                  </StructuredListRow>
                  <StructuredListRow>
                    <StructuredListCell noWrap>Unrealized P&amp;L</StructuredListCell>
                    <StructuredListCell className={state.position.unrealized_pnl >= 0 ? 'text-green' : 'text-red'}>
                      {state.position.unrealized_pnl >= 0 ? '+' : ''}₹{state.position.unrealized_pnl.toFixed(2)}
                    </StructuredListCell>
                  </StructuredListRow>
                  <StructuredListRow>
                    <StructuredListCell noWrap>Stop Loss</StructuredListCell>
                    <StructuredListCell className="text-red">₹{state.position.initial_sl_premium.toFixed(2)}</StructuredListCell>
                  </StructuredListRow>
                  <StructuredListRow>
                    <StructuredListCell noWrap>Trail SL</StructuredListCell>
                    <StructuredListCell>{state.position.trailing_sl_premium > 0 ? `₹${state.position.trailing_sl_premium.toFixed(2)}` : '—'}</StructuredListCell>
                  </StructuredListRow>
                  <StructuredListRow>
                    <StructuredListCell noWrap>Held</StructuredListCell>
                    <StructuredListCell>{Math.floor(state.position.holding_seconds / 60)}m {state.position.holding_seconds % 60}s</StructuredListCell>
                  </StructuredListRow>
                </StructuredListBody>
              </StructuredListWrapper>
            ) : (
              <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>No open position</p>
            )}
          </Tile>
        </Column>
      </Grid>
    </div>
  );
}
