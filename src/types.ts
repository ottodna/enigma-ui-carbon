export interface Decision {
  timestamp: string;
  decision_type: string;
  underlying?: string;
  spot_price?: number;
  option_symbol?: string;
  option_strike?: number;
  option_type?: 'CE' | 'PE';
  option_premium?: number;
  quantity?: number;
  entry_price?: number;
  exit_price?: number;
  pnl?: number;
  total_costs?: number;
  net_pnl?: number;
  reasoning?: string;
  market_context?: {
    vix?: number;
    trend?: string;
    regime?: string;
  };
  highest_premium?: number;
  lowest_premium?: number;
  premium_journey?: number[];
  hold_minutes?: number;
  exit_category?: string;
  target_hit_at?: string;
  trail_activated_at?: string;
}

export interface Position {
  contract: {
    symbol: string;
    strike: number;
    option_type: 'CE' | 'PE';
    underlying: string;
    ltp: number;
  };
  quantity: number;
  entry_premium: number;
  current_premium: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  highest_premium: number;
  lowest_premium: number;
  initial_sl_premium: number;
  trailing_sl_premium: number;
  target_price: number;
  holding_seconds: number;
}

export interface EnigmaState {
  underlying?: string;
  capital?: number;
  last_spot?: number;
  session_change_pts?: number;
  net_daily_pnl?: number;
  daily_pnl?: number;
  daily_costs?: number;
  trades_today?: number;
  paused?: boolean;
  pause_reason?: string;
  live_status?: string;
  status_detail?: string;
  ws_active?: boolean;
  vix?: number;
  price_trend?: string;
  regime?: string;
  position?: Position | null;
  params?: Record<string, number | string | boolean>;
  control?: {
    running: boolean;
    started_at: string;
    underlying: string;
  };
  target_met?: boolean;
  signals?: Record<string, number>;
}

export interface SSEMessage {
  state: EnigmaState;
  decisions: Decision[];
}
