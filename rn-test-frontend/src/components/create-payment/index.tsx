import React, { useState } from 'react';
import { useSendTransaction, useAccount } from 'wagmi';
import './styles.css';

interface PaymentForm {
  payee: string;
  amount: string;
  invoiceCurrency: string;
  paymentCurrency: string;
}

const CreatePayment: React.FC = () => {
  const [formData, setFormData] = useState<PaymentForm>({
    payee: '',
    amount: '',
    invoiceCurrency: 'ETH-sepolia-sepolia',
    paymentCurrency: 'ETH-sepolia-sepolia'
  });

  const [isExecuting, setIsExecuting] = useState(false);
  const { sendTransactionAsync } = useSendTransaction();
  const { isConnected } = useAccount();

  const currencyOptions = [
    { value: 'ETH-sepolia-sepolia', label: 'ETH (Sepolia)' },
    { value: 'FAU-sepolia', label: 'FAU (Sepolia)' },
    { value: 'fUSDC-sepolia', label: 'fUSDC (Sepolia)' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const updatePaymentStatus = async (paymentId: number, status: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/${paymentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        console.error('Failed to update payment status');
      } else {
        console.log(`Payment ${paymentId} status updated to: ${status}`);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const executeTransactions = async (transactions: Array<{ to: string; data: string; value: { hex: string } }>, paymentId: number) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        
        console.log(`Executing transaction ${i + 1}/${transactions.length}:`, tx);
        
        
        const txHash = await sendTransactionAsync({
          to: tx.to as `0x${string}`,
          data: tx.data as `0x${string}`,
          value: BigInt(tx.value.hex)
        });

        // As soon as we start sending transactions, update status to 'in-progress'
        await updatePaymentStatus(paymentId, 'in-progress');

        console.log(`Transaction ${i + 1} sent with hash:`, txHash);
      }
      
      alert('All transactions executed successfully!');
      
    } catch (error) {
      console.error('Transaction execution failed:', error);
      alert(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      await updatePaymentStatus(paymentId, 'failed');
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsExecuting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const data = await response.json();
      console.log('Backend response:', data);

      if (data.calldata && data.calldata.transactions) {
        await executeTransactions(data.calldata.transactions, data.payment.id);
      } else {
        throw new Error('No transaction data received from backend');
      }

    } catch (error) {
      console.error('Error in payment flow:', error);
      alert(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="create-payment">
      <h2>Create Payment</h2>
      
      <form onSubmit={handleSubmit} className="payment-form">
        <div className="form-group">
          <label htmlFor="payee">Payee Address</label>
          <input
            type="text"
            id="payee"
            name="payee"
            value={formData.payee}
            onChange={handleInputChange}
            placeholder="0x..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Payment Amount</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="0.00"
            step="0.000001"
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="invoiceCurrency">Invoice Currency</label>
          <select
            id="invoiceCurrency"
            name="invoiceCurrency"
            value={formData.invoiceCurrency}
            onChange={handleInputChange}
            required
          >
            {currencyOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="paymentCurrency">Payment Currency</label>
          <select
            id="paymentCurrency"
            name="paymentCurrency"
            value={formData.paymentCurrency}
            onChange={handleInputChange}
            required
          >
            {currencyOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={isExecuting || !isConnected}
        >
          {isExecuting ? 'Processing...' : 'Create & Execute Payment'}
        </button>
        
        {!isConnected && (
          <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '10px' }}>
            Please connect your wallet to create payments
          </p>
        )}
      </form>
    </div>
  );
};

export default CreatePayment;