import React, { useState } from 'react'
import {
  Button,
  Header,
  IconPlus,
  Main,
  Tabs,
  SyncIndicator,
  useLayout,
} from '@aragon/ui'
import { useGuiStyle } from '@aragon/api-react'
import { AppLogicProvider, useAppLogic } from './app-logic'
import { IdentityProvider } from './identity-manager'

import { MyPayroll, TeamPayroll } from './screens'
import { AddEmployee } from './panels'

const SCREENS = [
  { id: 'my-payroll', label: 'My payroll' },
  { id: 'team-payroll', label: 'Team payroll' },
]

const App = React.memo(function App() {
  const { actions, isSyncing, addEmployeePanel } = useAppLogic()
  const { appearance } = useGuiStyle()
  const { layoutName } = useLayout()
  const compactMode = layoutName === 'small'
  const [screen, changeScreen] = useState('my-payroll')

  return (
    <Main theme={appearance} assetsUrl="./aragon-ui">
      <>
        <SyncIndicator visible={isSyncing} />
        <Header
          primary="Payroll"
          secondary={
            (screen === 'my-payroll' && (
              <Button
                mode="strong"
                onClick={actions.requestSalary}
                label="Request salary"
                icon={<IconPlus />}
                display={compactMode ? 'icon' : 'label'}
              />
            )) ||
            (screen === 'team-payroll' && (
              <Button
                mode="strong"
                onClick={addEmployeePanel.requestOpen}
                label="Add new employee"
                icon={<IconPlus />}
                display={compactMode ? 'icon' : 'label'}
              />
            ))
          }
        />
        {
          <Tabs
            items={SCREENS.map(screen => screen.label)}
            selected={SCREENS.findIndex(s => s.id === screen)}
            onChange={i => changeScreen(SCREENS[i].id)}
          />
        }
        {screen === 'my-payroll' && <MyPayroll />}
        {screen === 'team-payroll' && <TeamPayroll />}
      </>
      <AddEmployee
        onAddEmployee={actions.addEmployee}
        panelState={addEmployeePanel}
      />
    </Main>
  )
})

export default function Payroll() {
  return (
    <AppLogicProvider>
      <IdentityProvider>
        <App />
      </IdentityProvider>
    </AppLogicProvider>
  )
}
