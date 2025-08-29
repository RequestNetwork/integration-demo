import React, { useState, useEffect } from 'react';
import './styles.css';

interface Payment {
  id: number;
  requestId: string;
  status: string;
}

const ViewPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      } else {
        console.error('Failed to fetch payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();

    const interval = setInterval(fetchPayments, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'in-progress':
        return 'status-in-progress';
      case 'confirmed':
        return 'status-confirmed';
      case 'failed':
        return 'status-failed';
      default:
        return 'status-pending';
    }
  };

  if (isLoading && payments.length === 0) {
    return (
      <div className="view-payments">
        <h2>View Payments</h2>
        <div className="loading">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="view-payments">
      <h2>View Payments</h2>
      <div className="payments-container">
        {payments.length === 0 ? (
          <div className="no-payments">No payments found</div>
        ) : (
          payments.map((payment) => (
            <div key={payment.id} className="payment-item">
              <span className="payment-id">Payment ID: {payment.id}</span>
              <span className={`status-pill ${getStatusClass(payment.status)}`}>
                {payment.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ViewPayments;