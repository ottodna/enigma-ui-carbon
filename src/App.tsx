import { useState } from 'react';
import {
  Header,
  HeaderContainer,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent,
  Content,
} from '@carbon/react';
import { Activity, ChartLine, Settings, CircleFilled, WarningFilled, Radio } from '@carbon/icons-react';
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

  const isRunning = state?.control?.running ?? false;
  const isPaused = state?.paused ?? false;

  return (
    <HeaderContainer
      render={() => (
        <>
          <Header aria-label="Enigma F&O" className="enigma-header">
            <SkipToContent />
            <HeaderName prefix="" href="#">
              ENIGMA <span style={{ color: 'var(--cds-text-secondary)', marginLeft: 8, fontWeight: 400 }}>F&amp;O</span>
            </HeaderName>
            <HeaderNavigation aria-label="Enigma navigation">
              <HeaderMenuItem isActive={tab === 'monitor'} onClick={() => switchTab('monitor')}>
                <Activity size={16} style={{ marginRight: 8 }} /> Monitor
              </HeaderMenuItem>
              <HeaderMenuItem isActive={tab === 'trades'} onClick={() => switchTab('trades')}>
                <ChartLine size={16} style={{ marginRight: 8 }} /> Trades
              </HeaderMenuItem>
              <HeaderMenuItem isActive={tab === 'settings'} onClick={() => switchTab('settings')}>
                <Settings size={16} style={{ marginRight: 8 }} /> Settings
              </HeaderMenuItem>
            </HeaderNavigation>
            <HeaderGlobalBar>
              {isPaused && (
                <HeaderGlobalAction aria-label="Paused" tooltipAlignment="end">
                  <WarningFilled size={20} style={{ color: '#f1c21b' }} />
                </HeaderGlobalAction>
              )}
              <HeaderGlobalAction aria-label={state?.ws_active ? 'WebSocket Live' : 'WebSocket Off'} tooltipAlignment="end">
                <CircleFilled size={16} style={{ color: state?.ws_active ? '#24a148' : '#6f6f6f' }} />
              </HeaderGlobalAction>
              <HeaderGlobalAction aria-label="Status" tooltipAlignment="end">
                <Radio size={16} style={{ color: isRunning ? '#24a148' : '#6f6f6f' }} />
              </HeaderGlobalAction>
            </HeaderGlobalBar>
          </Header>

          <Content className="enigma-content">
            {tab === 'monitor' && <MonitorPage state={state} decisions={decisions} />}
            {tab === 'trades' && <TradesPage decisions={decisions} />}
            {tab === 'settings' && <SettingsPage state={state} />}
          </Content>
        </>
      )}
    />
  );
}
