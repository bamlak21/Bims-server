import { User } from "../models/user.model.js"
import { randomUUID } from "crypto";
import { initialization, verify } from "../utils/chapa.js";
import { Property } from "../models/property.model.js";
import { Vehicle } from "../models/vehicle.model.js";

export const initiateContactPayment = async (req, res) => {
  try {
    const { listing_id, terms_accepted } = req.body;

    // Fix: Use req.user.id instead of req.user._id (JWT token uses 'id' field)
    const user_id = req.user.id;
    const amount = 200; // ETB 200

    // Validate terms acceptance
    if (!terms_accepted) {
      return res.status(400).json({
        message: "You must accept the terms and conditions to proceed"
      });
    }

    // Validate user type - only clients can pay for contact access
    if (req.user.userType !== 'client') {
      return res.status(403).json({
        message: "Only clients can pay for contact information access"
      });
    }

    // Find the listing (Property or Vehicle)
    let listing;
    let listingType;

    // Try Property first
    listing = await Property.findById(listing_id)
      .populate("owner_id", "firstName lastName email phoneNumber photo")
      .populate("broker_id", "firstName lastName email phoneNumber photo");

    if (listing) {
      listingType = 'Property';
    } else {
      // Try Vehicle
      listing = await Vehicle.findById(listing_id)
        .populate("owner_id", "firstName lastName email phoneNumber photo")
        .populate("broker_id", "firstName lastName email phoneNumber photo");

      if (listing) {
        listingType = 'Vehicle';
      }
    }

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Check if contact payment is required for this listing
    if (!listing.contact_payment_required) {
      return res.status(400).json({
        message: "Contact payment not required for this listing"
      });
    }

    // Check if user has already paid for this listing
    const user = await User.findById(user_id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const existingPayment = user.contact_payments?.find(
      p =>
        p.listing_id?.toString() === listing_id &&
        p.payment_status === "paid"
    );


    if (existingPayment) {
      return res.status(400).json({
        message: "Contact information already paid for this listing"
      });
    }

    // Generate unique transaction reference
    const tx_ref = `contact_${randomUUID()}`;


    // Initialize payment with Chapa
    const paymentData = {
      phoneNumber: req.user.phoneNumber,
      amount: amount, // Convert to cents
      tx_ref: tx_ref,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      userType: req.user.userType,
      partyType: 'client',
      commissionId: listing_id, // Use listing_id as reference
      commission_type: 'contact_access',
      app_fee: amount,
      platform: 'web',
      webReturnUrl: `${process.env.WEB_URL || 'http://localhost:5173'}/verify-contact-payment`
    };

    const chapaResponse = await initialization(
      paymentData.phoneNumber,
      paymentData.amount,
      paymentData.tx_ref,
      paymentData.firstName,
      paymentData.lastName,
      paymentData.email,
      paymentData.userType,
      paymentData.partyType,
      paymentData.commissionId,
      paymentData.commission_type,
      paymentData.app_fee,
      paymentData.platform,
      paymentData.webReturnUrl,
      // Pass return params explicitly
      {
        listing_id: listing_id,
        tx_ref: tx_ref,
        type: listingType,
        platform: 'web'
      },
      // Pass dedicated callback URL to avoid conflict with commissions
      `${process.env.CALLBACK_URL?.replace('/api/commissions/webhook', '') || 'https://convivial-theressa-discordantly.ngrok-free.dev'}/api/contact-payment/verify`
    );

    if (!chapaResponse) {
      return res.status(500).json({
        message: "Failed to initialize payment with Chapa"
      });
    }

    // Track payment attempt in user model with terms acceptance
    await User.findByIdAndUpdate(user_id, {
      $push: {
        contact_payments: {
          listing_id: listing._id,
          listing_type: listingType,
          tx_ref: tx_ref,
          amount_paid: amount,
          payment_status: 'pending',
          terms_accepted: true,
          terms_accepted_at: new Date()
        }
      }
    });

    return res.status(200).json({
      message: "Contact payment initiated successfully",
      payment_url: chapaResponse.url,
      tx_ref: tx_ref,
      amount: amount,
      listing_type: listingType,
      payment_status: "pending"
    });

  } catch (error) {
    console.error("Contact payment initiation failed:", error);
    return res.status(500).json({
      message: "Internal server error during payment initiation"
    });
  }
};

export const verifyContactPayment = async (req, res) => {
  try {
    // console.log('=== Contact Payment Verification ===');
    // console.log('Request method:', req.method);
    // console.log('Request query:', req.query);
    // console.log('Request body:', req.body);

    let tx_ref;
    let isWebhook = false;

    // Handle both GET (polling from frontend) and POST (webhook from Chapa)
    if (req.method === 'GET') {
      // Frontend polling - extract tx_ref from query params
      tx_ref = req.query.tx_ref;
      console.log('Processing GET request (polling) for tx_ref:', tx_ref);
    } else if (req.method === 'POST') {
      // Webhook from Chapa - extract from request body
      isWebhook = true;
      const event = req.body;
      const metadata = event.meta || {};
      const commissionType = metadata.commission_type;

      console.log('Processing POST webhook:', event);
      console.log('Commission type from metadata:', commissionType);

      // Only process contact access webhooks
      if (commissionType !== 'contact_access') {
        console.log('Ignoring webhook - not contact access type:', commissionType);
        return res.status(200).send("Ignored - not contact access");
      }

      if (event.event !== "charge.success" || event.status !== "success" || !event.tx_ref) {
        console.log('Ignoring webhook - not successful charge');
        return res.status(200).send("Ignored - not successful");
      }

      tx_ref = event.tx_ref;
      console.log('Processing contact payment webhook for tx_ref:', tx_ref);
    } else {
      return res.status(405).json({ message: "Method not allowed" });
    }

    if (!tx_ref) {
      return res.status(400).json({
        message: "Transaction reference is required"
      });
    }

    // Verify with Chapa
    const chapaResponse = await verify(tx_ref);

    if (!chapaResponse) {
      return res.status(500).json({
        message: "Failed to verify payment with Chapa"
      });
    }

    // Check if payment was successful
    if (chapaResponse.status !== 'success' || chapaResponse.data.status !== 'success') {
      // Mark payment as failed
      await User.updateOne(
        { 'contact_payments.tx_ref': tx_ref },
        {
          $set: {
            'contact_payments.$.payment_status': 'failed'
          }
        }
      );

      return res.status(400).json({
        message: "Payment verification failed - payment was not successful",
        status: 'failed'
      });
    }

    // For contact payments, find in user's contact_payments array
    if (isWebhook) {
      // Webhook processing - update contact payment status
      const updateResult = await User.updateOne(
        { 'contact_payments.tx_ref': tx_ref },
        {
          $set: {
            'contact_payments.$.payment_status': 'paid',
            'contact_payments.$.paid_at': new Date()
          }
        }
      );

      if (updateResult.matchedCount === 0) {
        console.error('Contact payment record not found for tx_ref:', tx_ref);
        return res.status(404).json({
          message: "Contact payment record not found"
        });
      }

      console.log('Contact payment updated successfully for tx_ref:', tx_ref);
      return res.status(200).json({
        message: "Contact payment verified successfully",
        status: 'paid',
        tx_ref: tx_ref,
        chapa_data: chapaResponse.data
      });
    } else {
      // GET request - polling - find payment in user's contact payments
      // Fix: Use req.user.id instead of req.user._id if relying on auth middleware
      const userId = req.user?.id || req.user?._id;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      const payment = user.contact_payments?.find(
        p => p.tx_ref === tx_ref
      );

      // If user has paid via webhook but polling check
      // We can also double check via tx_ref on chapaResponse
      // But finding in the user object is safest to confirm DB state

      if (!payment) {
        // Fallback: try to find user by tx_ref if req.user is not available or mismatch
        // But this is an authenticated endpoint usually. 
        return res.status(404).json({
          message: "Contact payment not found"
        });
      }

      // Update if pending but chapa says success (redundancy)
      if (payment.payment_status !== 'paid' && chapaResponse.data.status === 'success') {
        await User.updateOne(
          { 'contact_payments.tx_ref': tx_ref },
          {
            $set: {
              'contact_payments.$.payment_status': 'paid',
              'contact_payments.$.payment_date': new Date()
            }
          }
        );
        payment.payment_status = 'paid';
      }

      // Return payment status for polling
      return res.status(200).json({
        message: "Contact payment status retrieved",
        status: payment.payment_status,
        hasPaid: payment.payment_status === 'paid',
        tx_ref: tx_ref,
        amount: payment.amount_paid
      });
    }

  } catch (error) {
    console.error("Contact payment verification failed:", error);
    return res.status(500).json({
      message: "Internal server error during payment verification"
    });
  }
};

export const getContactPaymentStatus = async (req, res) => {
  try {
    const { listing_id } = req.params;

    // Fix: Use req.user.id instead of req.user._id (JWT token uses 'id' field)
    const user_id = req.user.id;

    // Validate user type
    if (req.user.userType !== 'client') {
      return res.status(200).json({
        hasPaid: true, // Non-clients don't need to pay
        payment_status: 'not_required',
        amount: 0
      });
    }

    const user = await User.findById(user_id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Find a successful payment first
    let payment = user.contact_payments?.find(
      p => p.listing_id?.toString() === listing_id && p.payment_status === 'paid'
    );

    // If no successful payment, find latest attempt
    if (!payment) {
      // We can just find the last one or any one
      // reverse() mutation avoidance: [...arr].reverse()
      const payments = user.contact_payments?.filter(p => p.listing_id?.toString() === listing_id);
      if (payments && payments.length > 0) {
        payment = payments[payments.length - 1];
      }
    }


    return res.status(200).json({
      hasPaid: payment?.payment_status === 'paid',
      payment_status: payment?.payment_status || 'none',
      amount: payment?.amount_paid || 200,
      paid_at: payment?.paid_at || null
    });

  } catch (error) {
    console.error("Error getting contact payment status:", error);
    return res.status(500).json({
      message: "Internal server error while checking payment status"
    });
  }
};

export const getUserContactPayments = async (req, res) => {
  try {
    // Fix: Use req.user.id instead of req.user._id (JWT token uses 'id' field)
    const user_id = req.user.id;

    const user = await User.findById(user_id)
      .populate({
        path: 'contact_payments.listing_id',
        model: (doc) => doc.listing_type === 'Property' ? 'Property' : 'Vehicle'
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return only contact payments for this user
    return res.status(200).json({
      contact_payments: user.contact_payments || [],
      total_paid: user.contact_payments?.filter(p => p.payment_status === 'paid').length || 0
    });

  } catch (error) {
    console.error("Error getting user contact payments:", error);
    return res.status(500).json({
      message: "Internal server error while fetching contact payments"
    });
  }
};