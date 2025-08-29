import { useState } from 'react'
import './App.css'
import ViewPayments from './components/view-payments'
import CreatePayment from './components/create-payment'
import WalletConnect from './components/wallet-connect';

type TabType = 'view' | 'create';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('view');

  return (
    <div className="app">
      <div className='header'>
        <h1>Request Network Demo</h1>
        <WalletConnect />
      </div>
      <div className="tabs">
        <button 
          className={activeTab === 'view' ? 'tab-button active' : 'tab-button'}
          onClick={() => setActiveTab('view')}
        >
          View Payments
        </button>
        <button 
          className={activeTab === 'create' ? 'tab-button active' : 'tab-button'}
          onClick={() => setActiveTab('create')}
        >
          Create Payment
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'view' && <ViewPayments />}
        {activeTab === 'create' && <CreatePayment />}
      </div>
    </div>
  )
}

export default App
