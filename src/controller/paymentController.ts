import { Request, Response } from 'express';
import prisma from '../model/index';

// To use Khalti sandbox, we should use a test secret key.
// Replace this with the actual KHALTI_SECRET_KEY in production.
const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
const KHALTI_INITIATE_URL = 'https://a.khalti.com/api/v2/epayment/initiate/';
const KHALTI_LOOKUP_URL = 'https://a.khalti.com/api/v2/epayment/lookup/';

export const initiatePayment = async (req: Request, res: Response) => {
    try {
        const { amount, purchaseOrderId, purchaseOrderName, returnUrl } = req.body;

        if (!amount || !purchaseOrderId || !purchaseOrderName || !returnUrl) {
            return res.status(400).json({ message: 'Missing required Khalti initiation parameters.' });
        }

        console.log('Initiating Khalti Payment:', { amount, purchaseOrderId, purchaseOrderName });

        const payload = {
            return_url: returnUrl,
            website_url: 'https://triffnytrip.com',
            amount: amount, // amount should be in paisa
            purchase_order_id: purchaseOrderId.toString(),
            purchase_order_name: purchaseOrderName,
        };

        const response = await fetch(KHALTI_INITIATE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${KHALTI_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Khalti Initiate Error:', data);
            return res.status(response.status).json({ message: 'Error initiating payment with Khalti.', error: data });
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('Error in initiatePayment:', error);
        return res.status(500).json({ message: 'Internal server error while initiating payment.' });
    }
};

export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const { pidx, bookingId, orderId } = req.body;

        if (!pidx) {
            return res.status(400).json({ message: 'pidx is required for verification.' });
        }

        console.log('Verifying Khalti Payment for pidx:', pidx);

        const payload = { pidx };

        const response = await fetch(KHALTI_LOOKUP_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${KHALTI_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Khalti Lookup Error:', data);
            return res.status(response.status).json({ message: 'Error verifying payment with Khalti.', error: data });
        }

        // Check if the payment was successful
        if (data.status === 'Completed') {
            // Update the Booking or Order to CONFIRMED
            if (bookingId) {
                await prisma.booking.update({
                    where: { id: parseInt(bookingId) },
                    data: { status: 'CONFIRMED' }
                });
                console.log(`Booking ${bookingId} confirmed.`);
            } else if (orderId) {
                await prisma.order.update({
                    where: { id: parseInt(orderId) },
                    data: { status: 'CONFIRMED' }
                });
                console.log(`Order ${orderId} confirmed.`);
            }
            return res.status(200).json({ message: 'Payment verified and status updated.', data });
        } else {
            return res.status(400).json({ message: `Payment status is ${data.status}.`, data });
        }
    } catch (error) {
        console.error('Error in verifyPayment:', error);
        return res.status(500).json({ message: 'Internal server error while verifying payment.' });
    }
};
