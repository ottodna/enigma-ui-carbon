import { useEffect, useRef } from 'react';
import {
  Grid, Column,
  Tile,
  StructuredListWrapper, StructuredListBody, StructuredListRow, StructuredListCell,
  Tag,
  SkeletonText,
  Button,
  Select, SelectItem,
} from '@carbon/react';
import { controlAction } from '../api';
import type { Decision, EnigmaState } from '../types';

const TAG_MAP: Record<string, { type: 'green' | 'red' | 'blue' | 'purple' | 'warm-gray' | 'gray'; label: string }> = {
  ENTRY: { type: 'green', label: 'BUY' },
  TARGET_HIT: { type: 'green', label: 'TARGET' },
  STOP_LOSS: { type: 'red', label: 'SL' },
  TRAILING_SL: { type: 'purple', label: 'TRAIL' },
  REJECTION: { type: 'red', label: 'REJECT' },
  TIME_EXIT: { type: 'blue', label: 'TIME' },
  MANUAL_SQUARE_OFF: { type: 'warm-gray', label: 'SQR OFF' },
  MIS_SQUARE_OFF: { type: 'warm-gray', label: 'MIS OFF' },
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
  const isRunning = state?.control?.running ?? false;
  const isPaused = state?.paused ?? false;
  const spot = state?.last_spot ?? 0;
  const spotChange = state?.session_change_pts ?? 0;
  const capital = state?.capital ?? 0;
  const remaining = capital + Math.min(0, pnl);
  const exitDecisions = decisions.filter(d => {
    const dt = d.decision_type?.toUpperCase() ?? '';
    return ['TARGET_HIT','STOP_LOSS','TRAILING_SL','TIME_EXIT','EXIT','REJECTION','MANUAL_SQUARE_OFF','MIS_SQUARE_OFF'].includes(dt);
  }).slice(-10).reverse();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Quick Bar — 6 metric tiles */}
      <Grid narrow style={{ padding: 'var(--cds-spacing-05) var(--cds-spacing-05) 0', flexShrink: 0 }}>
        <Column sm={2} md={2} lg={3}>
          <Tile className="metric-tile">
            <span className="metric-label">Net P&amp;L</span>
            <span className={`metric-value ${pnl > 0 ? 'text-green' : pnl < 0 ? 'text-red' : ''}`}>
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
        <Column sm={1} md={1} lg={1}>
          <Tile className="metric-tile">
            <span className="metric-label">VIX</span>
            <span className="metric-value">{state?.vix?.toFixed(1) ?? '—'}</span>
            <span className="metric-sub">India VIX</span>
          </Tile>
        </Column>
        <Column sm={1} md={1} lg={2}>
          <Tile className="metric-tile">
            <span className="metric-label">Trend</span>
            <span className="metric-value">{state?.price_trend ?? '—'}</span>
            <span className="metric-sub">{state?.regime ?? '—'}</span>
          </Tile>
        </Column>
        <Column sm={1} md={1} lg={2}>
          <Tile className="metric-tile">
            <span className="metric-label">Spot</span>
            <span className={`metric-value ${spotChange > 0 ? 'text-green' : spotChange < 0 ? 'text-red' : ''}`}>
              {spot ? spot.toLocaleString('en-IN') : '—'}
            </span>
            <span className="metric-sub">NIFTY · {spotChange >= 0 ? '+' : ''}{spotChange}</span>
          </Tile>
        </Column>
        <Column sm={1} md={1} lg={2}>
          <Tile className="metric-tile">
            <span className="metric-label">Capital</span>
            <span className={`metric-value ${remaining < capital ? 'text-red' : remaining > capital ? 'text-green' : ''}`}>
              ₹{remaining.toLocaleString('en-IN')}
            </span>
            <span className="metric-sub">Started: ₹{capital.toLocaleString('en-IN')}</span>
          </Tile>
        </Column>
      </Grid>

      {/* Main content: feed (left) + sidebar (right) */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 'var(--cds-spacing-05)' }}>
        {/* LEFT: Decision Feed */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginRight: 'var(--cds-spacing-05)' }}>
          <Tile className="feed-tile" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="feed-header">
              <span>Mechanical Decision Feed</span>
              <Tag type="gray" size="sm">{decisions.length}</Tag>
            </div>

            <div ref={feedRef} className="feed-scroll" style={{ flex: 1, overflowY: 'auto' }}>
              {decisions.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center' }}>
                  {state ? (
                    <span style={{ color: 'var(--cds-text-secondary)' }}>Waiting for trading decisions...</span>
                  ) : (
                    <SkeletonText paragraph lineCount={3} />
                  )}
                </div>
              ) : (
                <StructuredListWrapper isCondensed>
                  <StructuredListBody>
                    {decisions.slice(-80).reverse().map((d, i) => {
                      const dt = d.decision_type?.toUpperCase() ?? 'INFO';
                      const tag = TAG_MAP[dt] ?? { type: 'gray' as const, label: dt };
                      const ts = d.timestamp?.slice(11, 19) ?? '--:--';
                      const sym = d.option_symbol
                        ? `${d.underlying ?? ''} ${d.option_strike ?? ''}${d.option_type ?? ''}`
                        : '';
                      const trend = d.market_context?.trend ?? '';
                      const mom = d.reasoning?.match(/Momentum=([-\d.]+)pts\(([-\d.]+)%\)/);
                      const momStr = mom ? ` Δ${mom[2]}%` : '';
                      const pnlVal = d.net_pnl;

                      return (
                        <StructuredListRow key={i} className={`feed-row ${dt === 'ENTRY' ? 'row-entry' : dt === 'STOP_LOSS' ? 'row-loss' : ''}`}>
                          <StructuredListCell noWrap style={{ width: 64, color: 'var(--cds-text-secondary)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {ts}
                          </StructuredListCell>
                          <StructuredListCell noWrap style={{ width: 80 }}>
                            <Tag type={tag.type} size="sm">{tag.label}</Tag>
                          </StructuredListCell>
                          <StructuredListCell style={{ fontSize: '0.8rem' }}>
                            <span style={{ fontWeight: 600 }}>{sym}</span>
                            {d.entry_price != null && (
                              <span style={{ color: 'var(--cds-text-secondary)', marginLeft: 6 }}>
                                @₹{d.entry_price.toFixed(0)}{d.quantity ? ` ×${d.quantity}` : ''}
                              </span>
                            )}
                            {trend && <span className="trend-chip">{trend}</span>}
                            {momStr && <span style={{ color: 'var(--cds-text-placeholder)', fontSize: '0.7rem', marginLeft: 6 }}>{momStr}</span>}
                          </StructuredListCell>
                          {pnlVal != null && (
                            <StructuredListCell noWrap style={{ width: 90, textAlign: 'right' }}>
                              <span className={`${pnlVal >= 0 ? 'text-green' : 'text-red'}`} style={{ fontWeight: 600, fontSize: '0.82rem' }}>
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

            {/* Status Footer */}
            <div className="feed-footer">
              <span className="feed-status-emoji">{state?.live_status?.slice(0, 2) ?? '⏳'}</span>
              <span style={{ marginRight: 12 }}>{state?.live_status?.slice(3) ?? 'Loading...'}</span>
              {state?.status_detail && <span style={{ color: 'var(--cds-text-placeholder)', marginRight: 12 }}>{state.status_detail}</span>}
              <span className={`ws-badge ${state?.ws_active ? 'ws-live' : 'ws-off'}`}>
                {state?.ws_active ? '● WS Live' : '○ WS Off'}
              </span>
              {isPaused && (
                <Button kind="ghost" size="sm" onClick={() => controlAction('reset_pause')} style={{ marginLeft: 8 }}>
                  Reset Pause
                </Button>
              )}
            </div>
          </Tile>
        </div>

        {/* RIGHT: Position + Controls + Recent Trades */}
        <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 'var(--cds-spacing-05)' }}>
          {/* Position Card */}
          <Tile className="position-tile">
            <h4 className="tile-title">Active Position</h4>
            {state?.position ? (
              <StructuredListWrapper isCondensed>
                <StructuredListBody>
                  <StructuredListRow>
                    <StructuredListCell noWrap className="sl-label">Symbol</StructuredListCell>
                    <StructuredListCell className="sl-value">{state.position.contract.symbol}</StructuredListCell>
                  </StructuredListRow>
                  <StructuredListRow>
                    <StructuredListCell noWrap className="sl-label">Quantity</StructuredListCell>
                    <StructuredListCell className="sl-value">{state.position.quantity}</StructuredListCell>
                  </StructuredListRow>
                  <StructuredListRow>
                    <StructuredListCell noWrap className="sl-label">Entry</StructuredListCell>
                    <StructuredListCell className="sl-value">₹{state.position.entry_premium.toFixed(2)}</StructuredListCell>
                  </StructuredListRow>
                  <StructuredListRow>
                    <StructuredListCell noWrap className="sl-label">Current</StructuredListCell>
                    <StructuredListCell className="sl-value">₹{state.position.current_premium.toFixed(2)}</StructuredListCell>
                  </StructuredListRow>
                  <StructuredListRow>
                    <StructuredListCell noWrap className="sl-label">Unrealized</StructuredListCell>
                    <StructuredListCell className={`sl-value ${state.position.unrealized_pnl >= 0 ? 'text-green' : 'text-red'}`}>
                      {state.position.unrealized_pnl >= 0 ? '+' : ''}₹{state.position.unrealized_pnl.toFixed(2)}
                    </StructuredListCell>
                  </StructuredListRow>
                  <StructuredListRow>
                    <StructuredListCell noWrap className="sl-label">SL / Trail</StructuredListCell>
                    <StructuredListCell className="sl-value">
                      <span className="text-red">₹{state.position.initial_sl_premium.toFixed(2)}</span>
                      {state.position.trailing_sl_premium > 0 && <span> / ₹{state.position.trailing_sl_premium.toFixed(2)}</span>}
                    </StructuredListCell>
                  </StructuredListRow>
                  <StructuredListRow>
                    <StructuredListCell noWrap className="sl-label">Held</StructuredListCell>
                    <StructuredListCell className="sl-value">{Math.floor(state.position.holding_seconds / 60)}m {state.position.holding_seconds % 60}s</StructuredListCell>
                  </StructuredListRow>
                </StructuredListBody>
              </StructuredListWrapper>
            ) : (
              <p className="empty-label">No open position</p>
            )}
          </Tile>

          {/* Control Buttons */}
          <Tile>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {!isRunning ? (
                <Button kind="primary" size="sm" onClick={() => controlAction('start')}>Start</Button>
              ) : (
                <>
                  <Button kind="danger--ghost" size="sm" onClick={() => controlAction('stop')}>Stop</Button>
                  <Button kind="danger" size="sm" onClick={() => controlAction('square_off')}>Square Off</Button>
                </>
              )}
              <Select id="modeSelect" size="sm" defaultValue="paper" onChange={(e) => controlAction('switch_mode', { mode: e.target.value })} style={{ marginLeft: 'auto' }}>
                <SelectItem value="paper" text="Paper" />
                <SelectItem value="live" text="Live" />
              </Select>
            </div>
          </Tile>

          {/* Recent Trades */}
          <Tile>
            <h4 className="tile-title">Recent Trades</h4>
            {exitDecisions.length === 0 ? (
              <p className="empty-label">No trades yet</p>
            ) : (
              <StructuredListWrapper isCondensed>
                <StructuredListBody>
                  {exitDecisions.map((d, i) => {
                    const dt = d.decision_type?.toUpperCase() ?? '';
                    const tag = TAG_MAP[dt] ?? { type: 'gray' as const, label: dt };
                    const sym = d.option_symbol
                      ? `${d.underlying ?? ''} ${d.option_strike ?? ''}${d.option_type ?? ''}`
                      : '';
                    const pnlVal = d.net_pnl;
                    return (
                      <StructuredListRow key={i}>
                        <StructuredListCell noWrap style={{ width: 70, fontSize: '0.72rem', color: 'var(--cds-text-secondary)' }}>
                          {d.timestamp?.slice(11, 16) ?? '--:--'}
                        </StructuredListCell>
                        <StructuredListCell><Tag type={tag.type} size="sm">{tag.label}</Tag></StructuredListCell>
                        <StructuredListCell style={{ fontSize: '0.78rem' }}>{sym}</StructuredListCell>
                        {pnlVal != null && (
                          <StructuredListCell noWrap style={{ textAlign: 'right', width: 80 }}>
                            <span className={`${pnlVal >= 0 ? 'text-green' : 'text-red'}`} style={{ fontWeight: 600, fontSize: '0.78rem' }}>
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
          </Tile>
        </div>
      </div>
    </div>
  );
}
