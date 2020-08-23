import React, { useCallback, useState } from 'react'
import { useGuiStyle } from '@aragon/api-react'
import {
  Button,
  Header,
  IconPlus,
  Main,
  Tabs,
  SyncIndicator,
  useLayout,
} from '@aragon/ui'
import { MyPayroll, TeamPayroll } from './screens'
import { AppLogicProvider, useAppLogic } from './app-logic'
import { IdentityProvider } from './identity-manager'
import Panel from './panels'

const MY_PAYROLL = { id: 'my-payroll', label: 'My payroll' }
const TEAM_PAYROLL = { id: 'team-payroll', label: 'Team payroll' }
const SCREENS = [MY_PAYROLL, TEAM_PAYROLL]

function App() {
  const [screen, setScreen] = useState(MY_PAYROLL.id)
  const {
    actions,
    isSyncing,
    requestMode,
    panelState,
    requests,
  } = useAppLogic()
  const { appearance } = useGuiStyle()
  const { layoutName } = useLayout()
  const compactMode = layoutName === 'small'

  const handleScreenChange = useCallback(screenId => {
    setScreen(SCREENS[screenId].id)
  }, [])

  return (
    <Main theme={appearance} assetsUrl="./aragon-ui">
      <SyncIndicator visible={isSyncing} />
      <Header
        primary="Payroll"
        secondary={
          !isSyncing && (
            <>
              {screen === MY_PAYROLL.id && (
                <Button
                  mode="strong"
                  onClick={requests.payday}
                  label="Request salary"
                  icon={<IconPlus />}
                  display={compactMode ? 'icon' : 'label'}
                />
              )}
              {screen === TEAM_PAYROLL.id && (
                <Button
                  mode="strong"
                  onClick={requests.addEmployee}
                  label="New employee"
                  icon={<IconPlus />}
                  display={compactMode ? 'icon' : 'label'}
                />
              )}
            </>
          )
        }
      />
      {
        <Tabs
          items={SCREENS.map(screen => screen.label)}
          selected={SCREENS.findIndex(s => s.id === screen)}
          onChange={handleScreenChange}
        />
      }
      {screen === MY_PAYROLL.id && <MyPayroll isSyncing={isSyncing} />}
      {screen === TEAM_PAYROLL.id && (
        <TeamPayroll
          isSyncing={isSyncing}
          onRequestEditEquityOption={requests.editEquityOption}
          onRequestTerminateEmployee={requests.terminateEmployee}
        />
      )}
      <Panel
        requestMode={requestMode}
        panelState={panelState}
        actions={actions}
      />
    </Main>
  )
}

export default function Payroll() {
  return (
    <AppLogicProvider>
      <IdentityProvider>
        <App />
      </IdentityProvider>
    </AppLogicProvider>
  )
}
