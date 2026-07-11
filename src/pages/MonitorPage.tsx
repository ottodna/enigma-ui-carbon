import { useEffect, useRef } from 'react';
import {
  Grid, Column, Tag, SkeletonText
} from '@carbon/react';
import type { Decision, EnigmaState } from '../types';

// Tag mapping — consistent with backend exit types
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

  return (
    <Grid className="h-full">
      {/* LEFT: Decision Feed — 75% width */}
      <Column sm={4} md={6} lg={12} className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e1e30]">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#8888a0]">Mechanical Decision Feed</span>
          <span className="text-xs text-[#5a5a72]">{decisions.length}</span>
        </div>

        <div ref={feedRef} className="flex-1 overflow-y-auto data-mono">
          {decisions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[#5a5a72] text-sm">
              {state ? 'Waiting for decisions...' : (
                <div className="space-y-3 p-4">
                  <SkeletonText width="60%" />
                  <SkeletonText width="80%" />
                  <SkeletonText width="40%" />
                </div>
              )}
            </div>
          ) : (
            decisions.map((d, i) => {
              const dt = d.decision_type?.toUpperCase() ?? 'INFO';
              const tag = TAG_MAP[dt] ?? { type: 'gray' as const, label: dt };
              const ts = d.timestamp?.slice(11, 19) ?? '--:--';
              const symbol = d.option_symbol
                ? `${d.underlying ?? ''} ${d.option_strike ?? ''}${d.option_type ?? ''}`
                : '';
              const entryStr = d.entry_price ? ` @₹${d.entry_price.toFixed(0)}` : '';
              const qtyStr = d.quantity ? ` ×${d.quantity}` : '';
              const trend = d.market_context?.trend ?? '';
              const mom = d.reasoning?.match(/Momentum=([-\d.]+)pts\(([-\d.]+)%\)/);
              const momStr = mom ? ` Δ${mom[2]}%` : '';
              const pnl = d.net_pnl;

              return (
                <div
                  key={i}
                  className={`feed-enter px-4 py-1 border-b border-[#1e1e30] hover:bg-[#14141e] transition-colors ${
                    dt === 'ENTRY' ? 'bg-[#0a2a0a]' : dt === 'STOP_LOSS' || dt === 'REJECTION' ? 'bg-[#2a0a0a]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#5a5a72] w-14 shrink-0 tabular-nums">{ts}</span>
                    <Tag type={tag.type} size="sm">{tag.label}</Tag>
                    <span className="font-semibold text-[#e4e4ec] truncate">{symbol}</span>
                    <span className="text-[#8888a0] shrink-0">{entryStr}{qtyStr}</span>
                    {trend && <span className="text-[10px] text-[#4b9fff]">{trend}</span>}
                    {momStr && <span className="text-[10px] text-[#5a5a72]">{momStr}</span>}
                    {pnl != null && (
                      <span className={`ml-auto font-semibold tabular-nums ${pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                        {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {d.reasoning && symbol && (
                    <div className="ml-[76px] text-[11px] text-[#5a5a72] truncate">
                      {d.reasoning.slice(0, 140)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Column>

      {/* RIGHT: Stats + Position — 25% width */}
      <Column sm={0} md={2} lg={4} className="border-l border-[#1e1e30] bg-[#0e0e16] p-4 space-y-4 overflow-y-auto">
        {/* Quick Stats */}
        <section>
          <h3 className="text-xs font-semibold tracking-wider uppercase text-[#8888a0] mb-3">Session Stats</h3>
          <div className="space-y-2 text-xs">
            <QuickStat label="Spot" value={state?.last_spot?.toLocaleString() ?? '—'} />
            <QuickStat label="VIX" value={state?.vix?.toFixed(1) ?? '—'} />
            <QuickStat label="Trend" value={state?.price_trend ?? '—'} />
            <QuickStat label="Regime" value={state?.regime ?? '—'} />
          </div>
        </section>

        {/* Position Card */}
        <section>
          <h3 className="text-xs font-semibold tracking-wider uppercase text-[#8888a0] mb-3">Active Position</h3>
          {state?.position ? (
            <div className="space-y-2 text-xs">
              <QuickStat label="Symbol" value={state.position.contract.symbol} />
              <QuickStat label="Qty" value={String(state.position.quantity)} />
              <QuickStat label="Entry" value={`₹${state.position.entry_premium.toFixed(2)}`} />
              <QuickStat label="Current" value={`₹${state.position.current_premium.toFixed(2)}`} />
              <div className="flex justify-between py-1 border-t border-[#1e1e30]">
                <span className="text-[#8888a0]">Unrealized</span>
                <span className={`font-semibold tabular-nums ${state.position.unrealized_pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {state.position.unrealized_pnl >= 0 ? '+' : ''}₹{state.position.unrealized_pnl.toFixed(2)}
                </span>
              </div>
              <QuickStat label="Held" value={`${Math.floor(state.position.holding_seconds / 60)}m ${state.position.holding_seconds % 60}s`} />
            </div>
          ) : (
            <p className="text-xs text-[#5a5a72]">No open position</p>
          )}
        </section>
      </Column>
    </Grid>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#8888a0]">{label}</span>
      <span className="font-semibold tabular-nums text-[#e4e4ec]">{value}</span>
    </div>
  );
}
