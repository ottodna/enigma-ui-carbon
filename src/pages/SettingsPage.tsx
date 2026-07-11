import { useState, useEffect } from 'react';
import {
  Grid, Column,
  TextInput, NumberInput, Toggle, Select, SelectItem,
  Button, Heading, Tile, InlineNotification,
} from '@carbon/react';
import type { EnigmaState } from '../types';
import { controlAction, fetchState } from '../api';

interface Props {
  state: EnigmaState | null;
}

export function SettingsPage({ state }: Props) {
  const params = state?.params ?? {};
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [capitalVal, setCapitalVal] = useState(state?.capital ?? 100000);
  const [hardLimit, setHardLimit] = useState<number | undefined>();
  const [authCode, setAuthCode] = useState('');
  const [fyersMsg, setFyersMsg] = useState('');
  const [fyersStatus, setFyersStatus] = useState('Checking token status...');

  const [form, setForm] = useState({
    target_pct: params.target_pct ?? 5,
    stop_loss_points: params.stop_loss_points ?? 5,
    trailing_sl_points: params.trailing_sl_points ?? 5,
    max_hold_minutes: params.max_hold_minutes ?? 30,
    max_trades_per_day: params.max_trades_per_day ?? 6,
    cooldown_minutes: params.cooldown_minutes ?? 5,
    max_daily_loss_pct: params.max_daily_loss_pct ?? 10,
    max_lots: params.max_lots ?? 2,
    vix_threshold: params.vix_threshold ?? 12,
    min_momentum_pct: params.min_momentum_pct ?? 0.10,
    premium_range_min: params.premium_range_min ?? 20,
    premium_range_max: params.premium_range_max ?? 500,
    strategy: params.strategy ?? 'auto',
    vix_adaptive: params.vix_adaptive ?? false,
    use_points: params.use_points ?? false,
    lock_at_target: params.lock_at_target ?? true,
    sl_atr_mult: params.sl_atr_mult ?? 1.5,
    sl_atr_floor: params.sl_atr_floor ?? 3,
    trail_atr_mult: params.trail_atr_mult ?? 1.0,
    trail_atr_floor: params.trail_atr_floor ?? 2,
    daily_loss_limit_amount: params.daily_loss_limit_amount ?? 10000,
    weekly_loss_limit_amount: params.weekly_loss_limit_amount ?? 20000,
    monthly_loss_limit_amount: params.monthly_loss_limit_amount ?? 50000,
    daily_profit_target: params.daily_profit_target ?? 15000,
    daily_profit_target_pct: params.daily_profit_target_pct ?? 0,
    target_met_mode: params.target_met_mode ?? 'reduce_size',
    target_met_lots: params.target_met_lots ?? 1,
  });

  useEffect(() => {
    // Check Fyers token status on mount
    fetchState().then((d: { fyers_connected?: boolean; fyers_status?: string }) => {
      if (d?.fyers_connected) {
        setFyersStatus('✅ Token active — Fyers connected');
      } else {
        setFyersStatus('❌ Token expired or not set. Reauthenticate below.');
      }
    }).catch(() => setFyersStatus('⚠️ Unable to check token status'));
  }, []);

  const update = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await controlAction('update_params', { params: form });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const saveCapital = async () => {
    try {
      await controlAction('update_capital', { capital: capitalVal });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* ignore */ }
  };

  const submitAuth = async () => {
    try {
      await controlAction('fyers_auth', { auth_code: authCode });
      setFyersMsg('✅ Token generated successfully');
      setFyersStatus('✅ Token active — Fyers connected');
    } catch {
      setFyersMsg('❌ Failed to generate token');
    }
  };

  const restartEngine = () => controlAction('restart_engine');
  const rebuildContainer = () => controlAction('rebuild');

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 'var(--cds-spacing-06)' }}>
      <Grid narrow>
        {/* LEFT COLUMN */}
        <Column sm={4} md={4} lg={8}>
          {/* Capital & Limits */}
          <Tile style={{ marginBottom: 'var(--cds-spacing-05)' }}>
            <Heading style={{ fontSize: '0.85rem', marginBottom: 'var(--cds-spacing-05)' }}>Capital &amp; Limits</Heading>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <NumberInput id="setCapital" label="Paper Capital (₹)" value={capitalVal} min={500} step={100} style={{ width: 140 }} onChange={(_e, { value }) => setCapitalVal(Number(value))} />
              <Button size="sm" onClick={saveCapital}>Apply</Button>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginTop: 12, flexWrap: 'wrap' }}>
              <NumberInput id="setHardLimit" label="Hard Limit (₹)" value={hardLimit ?? 0} min={0} step={500} style={{ width: 140 }} onChange={(_e, { value }) => setHardLimit(Number(value) || undefined)} />
              <Button size="sm" kind="secondary" onClick={() => controlAction('update_hard_limit', { limit: hardLimit })}>Apply</Button>
            </div>
          </Tile>

          {/* Risk Limits */}
          <Tile style={{ marginBottom: 'var(--cds-spacing-05)' }}>
            <Heading style={{ fontSize: '0.85rem', marginBottom: 'var(--cds-spacing-05)' }}>Risk Limits (₹)</Heading>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--cds-spacing-04)' }}>
              <NumberInput id="dailyLoss" label="Daily Loss (₹)" value={form.daily_loss_limit_amount as number} min={0} step={500} onChange={(_e, { value }) => update('daily_loss_limit_amount', Number(value))} />
              <NumberInput id="weeklyLoss" label="Weekly Loss (₹)" value={form.weekly_loss_limit_amount as number} min={0} step={500} onChange={(_e, { value }) => update('weekly_loss_limit_amount', Number(value))} />
              <NumberInput id="monthlyLoss" label="Monthly Loss (₹)" value={form.monthly_loss_limit_amount as number} min={0} step={1000} onChange={(_e, { value }) => update('monthly_loss_limit_amount', Number(value))} />
              <NumberInput id="profitTarget" label="Daily Profit Target (₹)" value={form.daily_profit_target as number} min={0} step={500} onChange={(_e, { value }) => update('daily_profit_target', Number(value))} />
              <NumberInput id="profitTargetPct" label="Profit Target (%)" value={form.daily_profit_target_pct as number} min={0} max={20} step={0.5} onChange={(_e, { value }) => update('daily_profit_target_pct', Number(value))} />
              <Select id="targetMetMode" labelText="When Target Met" value={form.target_met_mode as string} onChange={(e) => update('target_met_mode', e.target.value)}>
                <SelectItem value="reduce_size" text="Reduce Lot Size" />
                <SelectItem value="stop" text="Stop Trading" />
              </Select>
              <NumberInput id="targetMetLots" label="Target Met Lots" value={form.target_met_lots as number} min={1} max={5} step={1} onChange={(_e, { value }) => update('target_met_lots', Number(value))} />
            </div>
          </Tile>

          {/* Strategy Parameters */}
          <Tile style={{ marginBottom: 'var(--cds-spacing-05)' }}>
            <Heading style={{ fontSize: '0.85rem', marginBottom: 'var(--cds-spacing-05)' }}>Strategy Parameters</Heading>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--cds-spacing-04)' }}>
              <NumberInput id="targetPct" label="Target (%)" value={form.target_pct as number} min={2} max={50} step={0.5} onChange={(_e, { value }) => update('target_pct', Number(value))} />
              <NumberInput id="stopLoss" label="Stop Loss (pts)" value={form.stop_loss_points as number} min={1} max={20} step={0.5} onChange={(_e, { value }) => update('stop_loss_points', Number(value))} />
              <NumberInput id="trailingSl" label="Trailing SL (pts)" value={form.trailing_sl_points as number} min={1} max={20} step={0.5} onChange={(_e, { value }) => update('trailing_sl_points', Number(value))} />
              <NumberInput id="maxHold" label="Max Hold (min)" value={form.max_hold_minutes as number} min={5} max={120} step={5} onChange={(_e, { value }) => update('max_hold_minutes', Number(value))} />
              <NumberInput id="maxTrades" label="Max Trades/Day" value={form.max_trades_per_day as number} min={1} max={40} step={1} onChange={(_e, { value }) => update('max_trades_per_day', Number(value))} />
              <NumberInput id="cooldown" label="Cooldown (min)" value={form.cooldown_minutes as number} min={1} max={30} step={1} onChange={(_e, { value }) => update('cooldown_minutes', Number(value))} />
              <NumberInput id="maxDailyLoss" label="Max Daily Loss (%)" value={form.max_daily_loss_pct as number} min={2} max={100} step={1} onChange={(_e, { value }) => update('max_daily_loss_pct', Number(value))} />
              <NumberInput id="maxLots" label="Max Lots" value={form.max_lots as number} min={1} max={10} step={1} onChange={(_e, { value }) => update('max_lots', Number(value))} />
              <NumberInput id="vixThr" label="VIX Threshold" value={form.vix_threshold as number} min={5} max={25} step={1} onChange={(_e, { value }) => update('vix_threshold', Number(value))} />
              <NumberInput id="momPct" label="Min Momentum (%)" value={form.min_momentum_pct as number} min={0.02} max={1} step={0.01} onChange={(_e, { value }) => update('min_momentum_pct', Number(value))} />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <NumberInput id="premMin" label="Prem Min (₹)" value={form.premium_range_min as number} min={5} max={200} step={5} style={{ width: 100 }} onChange={(_e, { value }) => update('premium_range_min', Number(value))} />
                <NumberInput id="premMax" label="Prem Max (₹)" value={form.premium_range_max as number} min={50} max={2000} step={10} style={{ width: 100 }} onChange={(_e, { value }) => update('premium_range_max', Number(value))} />
              </div>
              <Select id="strategy" labelText="Strategy" value={form.strategy as string} onChange={(e) => update('strategy', e.target.value)}>
                <SelectItem value="auto" text="AUTO" />
                <SelectItem value="atm" text="ATM" />
                <SelectItem value="otm" text="OTM" />
                <SelectItem value="itm" text="ITM" />
              </Select>
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 'var(--cds-spacing-04)', flexWrap: 'wrap' }}>
              <Toggle id="vixAdaptive" labelText="VIX Adaptive" toggled={form.vix_adaptive as boolean} onToggle={(v) => update('vix_adaptive', v)} />
              <Toggle id="lockTarget" labelText="Lock at Target" toggled={form.lock_at_target as boolean} onToggle={(v) => update('lock_at_target', v)} />
              <Toggle id="usePoints" labelText="Use Points (vs %)" toggled={form.use_points as boolean} onToggle={(v) => update('use_points', v)} />
            </div>
            {saved && <InlineNotification kind="success" title="Settings saved" style={{ marginTop: 'var(--cds-spacing-04)' }} />}
            <Button kind="primary" onClick={save} disabled={saving} style={{ marginTop: 'var(--cds-spacing-04)', width: '100%' }}>
              {saving ? 'Saving...' : 'Save Strategy Settings'}
            </Button>
          </Tile>

          {/* Telegram Alerts */}
          <Tile style={{ marginBottom: 'var(--cds-spacing-05)' }}>
            <Heading style={{ fontSize: '0.85rem', marginBottom: 'var(--cds-spacing-05)' }}>Telegram Alerts</Heading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cds-spacing-04)' }}>
              <Toggle id="tgToggle" labelText="Enable Telegram Alerts" toggled={false} onToggle={(v) => controlAction('toggle_telegram', { enabled: v })} />
              <TextInput id="tgToken" labelText="Bot Token" type="password" placeholder="123:abc" value="" onChange={() => {}} />
              <TextInput id="tgChatId" labelText="Chat ID" placeholder="-100..." value="" onChange={() => {}} />
              <Button size="sm" kind="secondary" onClick={() => controlAction('update_telegram')}>Save Telegram Config</Button>
            </div>
          </Tile>
        </Column>

        {/* RIGHT COLUMN */}
        <Column sm={4} md={4} lg={8}>
          {/* Fyers Authentication */}
          <Tile style={{ marginBottom: 'var(--cds-spacing-05)' }}>
            <Heading style={{ fontSize: '0.85rem', marginBottom: 8 }}>Fyers Authentication</Heading>
            <p style={{ fontSize: '0.78rem', color: 'var(--cds-text-secondary)', marginBottom: 12 }}>
              SEBI requires daily reauthentication. Generate a fresh token before 9:15 AM.
            </p>
            <div style={{ background: 'var(--cds-layer-accent)', padding: 12, marginBottom: 12, borderRadius: 4 }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: 6 }}>
                <strong>Step 1:</strong> Login to Fyers and copy the auth_code:
              </p>
              <a href="https://api.fyers.in/api/v2/generate-authcode?client_id=XLG3A7MUOF-100&redirect_uri=https://trade.fyers.in/api/v2/generate-authcode&response_type=code&state=sample_state&grant_type=authorization_code" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: 10, background: 'var(--cds-button-primary)', color: '#fff', textAlign: 'center', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none', borderRadius: 4 }}>
                Open Fyers Login
              </a>
            </div>
            <div style={{ background: 'var(--cds-layer-accent)', padding: 12, marginBottom: 12, borderRadius: 4 }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: 6 }}>
                <strong>Step 2:</strong> Paste the auth_code:
              </p>
              <TextInput id="authCode" labelText="" placeholder="eyJhbG...NiIs..." value={authCode} onChange={(e) => setAuthCode(e.target.value)} style={{ marginBottom: 8 }} />
              <Button onClick={submitAuth} style={{ width: '100%' }}>Submit &amp; Generate Token</Button>
              {fyersMsg && <p style={{ fontSize: '0.75rem', marginTop: 8, color: fyersMsg.includes('✅') ? 'var(--cds-support-success)' : 'var(--cds-support-error)' }}>{fyersMsg}</p>}
            </div>
            <div style={{ padding: 'var(--cds-spacing-03)', background: 'var(--cds-layer-accent)', borderRadius: 4, fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
              {fyersStatus}
            </div>
          </Tile>

          {/* System Info */}
          <Tile style={{ marginBottom: 'var(--cds-spacing-05)' }}>
            <Heading style={{ fontSize: '0.85rem', marginBottom: 'var(--cds-spacing-05)' }}>System Info</Heading>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 'var(--cds-spacing-03)', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--cds-text-secondary)' }}>Model</span>
              <span>rule-based-v1</span>
              <span style={{ color: 'var(--cds-text-secondary)' }}>Dashboard</span>
              <span>v3 — Mechanical</span>
              <span style={{ color: 'var(--cds-text-secondary)' }}>Session</span>
              <span>{state?.control?.started_at?.slice(0, 19) ?? '—'}</span>
              <span style={{ color: 'var(--cds-text-secondary)' }}>Engine</span>
              <span>{state?.live_status ?? '—'}</span>
            </div>
          </Tile>

          {/* Control Actions */}
          <Tile>
            <Heading style={{ fontSize: '0.85rem', marginBottom: 'var(--cds-spacing-05)' }}>Control Actions</Heading>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button kind="secondary" size="sm" onClick={restartEngine}>Restart Engine</Button>
              <Button kind="danger--ghost" size="sm" onClick={rebuildContainer}>Rebuild Container</Button>
            </div>
          </Tile>
        </Column>
      </Grid>
    </div>
  );
}
