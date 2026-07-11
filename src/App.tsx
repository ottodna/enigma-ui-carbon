import { useState } from 'react';
import {
  Header,
  HeaderContainer,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  SkipToContent,
  Content,
} from '@carbon/react';
import { Activity, ChartLine, Settings } from '@carbon/icons-react';
import { useSSE } from './useSSE';
import { MonitorPage } from './pages/MonitorPage';
import { TradesPage } from './pages/TradesPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const savedTab = localStorage.getItem('enigma-tab') ?? 'monitor';
  const [tab, setTab] = useState(savedTab);
  const { state, decisions } = useSSE();

  const switchTab = (t: string) => {
    setTab(t);
    localStorage.setItem('enigma-tab', t);
  };

  const wsColor = state?.ws_active ? '#22c55e' : '#5a5a72';

  return (
    <HeaderContainer
      render={() => (
        <>
          <Header aria-label="Enigma F&O">
            <SkipToContent />
            <HeaderName prefix="" href="#">
              <span className="font-bold tracking-wider">ENIGMA</span>
              <span className="text-[#5a5a72] ml-2 text-sm font-normal">F&amp;O</span>
            </HeaderName>
            <HeaderNavigation aria-label="Enigma">
              <HeaderMenuItem
                isActive={tab === 'monitor'}
                onClick={() => switchTab('monitor')}
              >
                <Activity size={16} className="mr-2" /> Monitor
              </HeaderMenuItem>
              <HeaderMenuItem
                isActive={tab === 'trades'}
                onClick={() => switchTab('trades')}
              >
                <ChartLine size={16} className="mr-2" /> Trades
              </HeaderMenuItem>
              <HeaderMenuItem
                isActive={tab === 'settings'}
                onClick={() => switchTab('settings')}
              >
                <Settings size={16} className="mr-2" /> Settings
              </HeaderMenuItem>
            </HeaderNavigation>
            <div className="flex items-center gap-3 px-4 text-xs">
              <span style={{ color: wsColor }}>
                {state?.ws_active ? '●' : '○'} WS {state?.ws_active ? 'Live' : 'Off'}
              </span>
              {state?.underlying && (
                <span className="text-[#8888a0]">{state.underlying} {state.last_spot?.toLocaleString()}</span>
              )}
              {state?.paused && (
                <span className="text-[#eab308] font-semibold">PAUSED</span>
              )}
            </div>
          </Header>

          <Content className="h-[calc(100vh-48px)] overflow-hidden">
            {tab === 'monitor' && <MonitorPage state={state} decisions={decisions} />}
            {tab === 'trades' && <TradesPage decisions={decisions} />}
            {tab === 'settings' && <SettingsPage state={state} />}
          </Content>

          <footer className="flex items-center gap-4 px-4 py-1 border-t border-[#1e1e30] bg-[#0e0e16] text-xs text-[#5a5a72]">
            <span>{state?.live_status ?? '⏳ Loading'}</span>
            {state?.status_detail && <span>{state.status_detail}</span>}
            <span className="ml-auto">Capital: ₹{(state?.capital ?? 0).toLocaleString()}</span>
            <span className={((state?.net_daily_pnl ?? 0) >= 0) ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
              P&amp;L: {state?.net_daily_pnl != null ? (state.net_daily_pnl >= 0 ? '+' : '') + '₹' + state.net_daily_pnl.toFixed(2) : '—'}
            </span>
          </footer>
        </>
      )}
    />
  );
}
