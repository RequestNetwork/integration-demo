import { useAccount, useConnect, useDisconnect } from 'wagmi'
import './styles.css';

const WalletConnect: React.FC = () => {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div className="wallet-status">
        <div className="wallet-info">
          <span>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
          <button onClick={() => disconnect()} className="disconnect-btn">
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="wallet-connect">
      <button 
        onClick={() => connect({ connector: connectors[0] })}
        className="connect-btn"
      >
        Connect Wallet
      </button>
    </div>
  )
}

export default WalletConnect