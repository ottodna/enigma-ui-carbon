import { useState } from 'react';
import {
  Grid, Column, NumberInput, Toggle, Select, SelectItem,
  Button, Section, Heading, InlineNotification,
} from '@carbon/react';
import type { EnigmaState } from '../types';
import { controlAction } from '../api';

interface Props {
  state: EnigmaState | null;
}

export function SettingsPage({ state }: Props) {
  const params = state?.params ?? {};
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    // Risk limits (₹)
    daily_loss_limit_amount: params.daily_loss_limit_amount ?? 10000,
    weekly_loss_limit_amount: params.weekly_loss_limit_amount ?? 20000,
    monthly_loss_limit_amount: params.monthly_loss_limit_amount ?? 50000,
    daily_profit_target: params.daily_profit_target ?? 15000,
    daily_profit_target_pct: params.daily_profit_target_pct ?? 0,
    target_met_mode: params.target_met_mode ?? 'reduce_size',
    target_met_lots: params.target_met_lots ?? 1,
  });

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

  return (
    <div className="p-6 overflow-y-auto h-full">
      <Grid narrow>
        {/* Strategy Parameters */}
        <Column sm={4} md={4} lg={8}>
          <Section>
            <Heading className="mb-4">Strategy Parameters</Heading>
          </Section>
          <div className="space-y-3">
            <NumberInput id="target_pct" label="Target (%)" value={form.target_pct as number} min={2} max={50} step={0.5} onChange={(_e, { value }) => update('target_pct', Number(value))} />
            <NumberInput id="stop_loss_points" label="Stop Loss (pts)" value={form.stop_loss_points as number} min={1} max={20} step={0.5} onChange={(_e, { value }) => update('stop_loss_points', Number(value))} />
            <NumberInput id="trailing_sl_points" label="Trailing SL (pts)" value={form.trailing_sl_points as number} min={1} max={20} step={0.5} onChange={(_e, { value }) => update('trailing_sl_points', Number(value))} />
            <NumberInput id="max_hold_minutes" label="Max Hold (min)" value={form.max_hold_minutes as number} min={5} max={120} step={5} onChange={(_e, { value }) => update('max_hold_minutes', Number(value))} />
            <NumberInput id="max_trades_per_day" label="Max Trades/Day" value={form.max_trades_per_day as number} min={1} max={40} step={1} onChange={(_e, { value }) => update('max_trades_per_day', Number(value))} />
            <NumberInput id="cooldown_minutes" label="Cooldown (min)" value={form.cooldown_minutes as number} min={1} max={30} step={1} onChange={(_e, { value }) => update('cooldown_minutes', Number(value))} />
            <NumberInput id="max_daily_loss_pct" label="Max Daily Loss (%)" value={form.max_daily_loss_pct as number} min={2} max={100} step={1} onChange={(_e, { value }) => update('max_daily_loss_pct', Number(value))} />
            <NumberInput id="max_lots" label="Max Lots" value={form.max_lots as number} min={1} max={10} step={1} onChange={(_e, { value }) => update('max_lots', Number(value))} />
            <NumberInput id="vix_threshold" label="VIX Threshold" value={form.vix_threshold as number} min={5} max={25} step={1} onChange={(_e, { value }) => update('vix_threshold', Number(value))} />
            <NumberInput id="min_momentum_pct" label="Min Momentum (%)" value={form.min_momentum_pct as number} min={0.02} max={1} step={0.01} onChange={(_e, { value }) => update('min_momentum_pct', Number(value))} />
            <NumberInput id="premium_range_min" label="Premium Min (₹)" value={form.premium_range_min as number} min={5} max={200} step={5} onChange={(_e, { value }) => update('premium_range_min', Number(value))} />
            <NumberInput id="premium_range_max" label="Premium Max (₹)" value={form.premium_range_max as number} min={50} max={2000} step={10} onChange={(_e, { value }) => update('premium_range_max', Number(value))} />
            <Select id="strategy" labelText="Strategy" value={form.strategy as string} onChange={(e) => update('strategy', e.target.value)}>
              <SelectItem value="auto" text="AUTO" />
              <SelectItem value="atm" text="ATM" />
              <SelectItem value="otm" text="OTM" />
              <SelectItem value="itm" text="ITM" />
            </Select>
            <Toggle id="vix_adaptive" labelText="VIX Adaptive" toggled={form.vix_adaptive as boolean} onToggle={(v) => update('vix_adaptive', v)} />
            <Toggle id="use_points" labelText="Use Points (vs %)" toggled={form.use_points as boolean} onToggle={(v) => update('use_points', v)} />
            <Toggle id="lock_at_target" labelText="Lock at Target" toggled={form.lock_at_target as boolean} onToggle={(v) => update('lock_at_target', v)} />
          </div>
        </Column>

        {/* Risk Limits (₹) */}
        <Column sm={4} md={4} lg={8}>
          <Section>
            <Heading className="mb-4 mt-6 md:mt-0">Risk Limits (₹)</Heading>
          </Section>
          <div className="space-y-3">
            <NumberInput id="daily_loss_amount" label="Daily Loss (₹)" value={form.daily_loss_limit_amount as number} min={0} step={500} onChange={(_e, { value }) => update('daily_loss_limit_amount', Number(value))} />
            <NumberInput id="weekly_loss_amount" label="Weekly Loss (₹)" value={form.weekly_loss_limit_amount as number} min={0} step={500} onChange={(_e, { value }) => update('weekly_loss_limit_amount', Number(value))} />
            <NumberInput id="monthly_loss_amount" label="Monthly Loss (₹)" value={form.monthly_loss_limit_amount as number} min={0} step={1000} onChange={(_e, { value }) => update('monthly_loss_limit_amount', Number(value))} />
            <NumberInput id="daily_profit_target" label="Daily Profit Target (₹)" value={form.daily_profit_target as number} min={0} step={500} onChange={(_e, { value }) => update('daily_profit_target', Number(value))} />
            <NumberInput id="daily_profit_target_pct" label="Profit Target (%)" value={form.daily_profit_target_pct as number} min={0} max={20} step={0.5} onChange={(_e, { value }) => update('daily_profit_target_pct', Number(value))} />
            <Select id="target_met_mode" labelText="When Target Met" value={form.target_met_mode as string} onChange={(e) => update('target_met_mode', e.target.value)}>
              <SelectItem value="reduce_size" text="Reduce Lot Size" />
              <SelectItem value="stop" text="Stop Trading" />
            </Select>
            <NumberInput id="target_met_lots" label="Target Met Lots" value={form.target_met_lots as number} min={1} max={5} step={1} onChange={(_e, { value }) => update('target_met_lots', Number(value))} />
            <Select id="target_met_mode" labelText="When Target Met" value={form.target_met_mode as string} onChange={(e) => update('target_met_mode', e.target.value)}>
              <SelectItem value="reduce_size" text="Reduce Lot Size" />
              <SelectItem value="stop" text="Stop Trading" />
            </Select>
            <NumberInput id="target_met_lots" label="Target Met Lots" value={form.target_met_lots as number} min={1} max={5} step={1} onChange={(_, { value }) => update('target_met_lots', value)} />

            {saved && (
              <InlineNotification kind="success" title="Settings saved" subtitle="Engine picks up within 5 seconds" />
            )}
            <Button kind="primary" onClick={save} disabled={saving} className="mt-4 w-full">
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </Column>
      </Grid>
    </div>
  );
}
