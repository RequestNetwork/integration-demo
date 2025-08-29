import 'dotenv/config';
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import { db } from './db';
import { payments } from './db/schema';
import crypto from "node:crypto";
import { eq } from 'drizzle-orm';

const fastify = Fastify({
  logger: true
});

fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
  return { message: 'Hello World!' };
});

interface PaymentBody {
  payee: string;
  amount: string;
  invoiceCurrency: string;
  paymentCurrency: string;
}

fastify.post('/payments', async (request: FastifyRequest<{ Body: PaymentBody }>, reply: FastifyReply) => {
  try {
    const { payee, amount, invoiceCurrency, paymentCurrency } = request.body;

    if (!payee || !amount || !invoiceCurrency || !paymentCurrency) {
      return reply.status(400).send({ 
        error: 'Missing required fields: payee, amount, invoiceCurrency, paymentCurrency' 
      });
    }

    const response = await fetch(`${process.env.RN_API_URL}/payouts`, {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.RN_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payee,
        amount,
        invoiceCurrency,
        paymentCurrency
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      fastify.log.error(`Request Network API error: ${response.status} - ${errorText}`);
      return reply.status(response.status).send({ 
        error: 'Failed to create payment with Request Network API',
        details: errorText
      });
    }

    const rnApiResponse: any = await response.json();
    console.log('Request Network API response:', JSON.stringify(rnApiResponse, null, 2));

    const [savedPayment] = await db.insert(payments).values({
      requestId: rnApiResponse.requestId,
      status: 'pending'
    }).returning();

    console.log('Payment saved to database:', savedPayment);

    return {
      payment: savedPayment,
      calldata: {
        transactions: rnApiResponse.transactions,
        metadata: rnApiResponse.metadata
      }
    };

  } catch (error) {
    console.error('Error creating payment:', error);
    return reply.status(500).send({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

interface UpdatePaymentStatusBody {
  status: string;
}

fastify.patch('/payments/:id', async (request: FastifyRequest<{ 
  Params: { id: string };
  Body: UpdatePaymentStatusBody 
}>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    const { status } = request.body;

    if (!status) {
      return reply.status(400).send({ 
        error: 'Status is required' 
      });
    }

    const updatedPayment = await db.update(payments)
      .set({ status })
      .where(eq(payments.id, parseInt(id)))
      .returning();

    if (!updatedPayment.length) {
      return reply.status(404).send({ 
        error: 'Payment not found' 
      });
    }

    console.log('Payment status updated:', updatedPayment[0]);

    return {
      payment: updatedPayment[0]
    };

  } catch (error) {
    console.error('Error updating payment status:', error);
    return reply.status(500).send({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

fastify.post('/webhooks', async (request: FastifyRequest, reply: FastifyReply) => {
  let webhookData: Record<string, unknown> = {};

  try {
    const body = request.body as Record<string, unknown>;
    webhookData = body;
    
    const signature = request.headers['x-request-network-signature'] as string;
    const webhookSecret = process.env.RN_WEBHOOK_SECRET;

    if (!webhookSecret) {
      fastify.log.error('RN_WEBHOOK_SECRET is not set');
      return reply.status(500).send({ error: 'Webhook secret not configured' });
    }

    const expectedSignature = crypto.createHmac('sha256', webhookSecret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (signature !== expectedSignature) {
      fastify.log.error('Invalid webhook signature');
      return reply.status(401).send({ error: 'Invalid signature' });
    }

    const { requestId, event } = body;

    console.log(`Webhook received: ${event} for request ${requestId}`, {
      webhookData: body
    });

    // Log the event
    console.log(`Webhook event: ${event}`);
    console.log('Full webhook data:', JSON.stringify(body, null, 2));

    switch (event) {
      case "payment.confirmed":
        await db.update(payments)
          .set({ status: 'confirmed' })
          .where(eq(payments.requestId, requestId as string));
        break;
    }

    return reply.send({ code: 200, message: 'Webhook received' });

  } catch (error) {
    console.error('Webhook error:', {
      error,
      requestId: webhookData?.requestId,
      event: webhookData?.event,
    });

    return reply.status(500).send({ error: 'Internal server error' });
  }
});

fastify.get('/payments', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const allPayments = await db.select().from(payments);
    return { payments: allPayments };
  } catch (error) {
    console.error('Error fetching payments:', error);
    return reply.status(500).send({ 
      error: 'Failed to fetch payments',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

const start = async () => {
  try {
    const port =  3000;
    const host = 'localhost';
    
    await fastify.register(require('@fastify/cors'), {
      origin: true, // change to your frontend URL in production
      methods: ['GET', 'POST', 'PATCH'],
    });
    await fastify.listen({ port, host });
    console.log(`Server listening on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
