import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.CHAPA_TOKEN) {
  throw new Error("Chapa token not found");
}

const Token = process.env.CHAPA_TOKEN;
// Platform detection helper
export const detectPlatform = (returnUrl) => {
  if (!returnUrl) return 'web';

  // App schemes detection
  const appSchemes = ['bimsapp://', 'myapp://', 'exp://'];
  return appSchemes.some(scheme => returnUrl.startsWith(scheme)) ? 'app' : 'web';
};

// Enhanced return URL handler
export const generateReturnUrl = (platform, customUrl = null) => {
  if (platform === 'app') {
    return customUrl=`${process.env.APP_SCHEME || 'http://192.168.100.107:8081'}://payment-verification`;
  }

  return customUrl=`${process.env.WEB_URL || 'http://localhost:5173'}/verify-payment`;
};

const opt = {
  url: "",
  headers: {
    Authorization: `Bearer ${Token}`,
    "Content-Type": "application/json",
  },
};

export const initialization = async (
  phoneNumber,
  amount,
  tx_ref,
  firstName,
  lastName,
  email,
  userType,
  partyType,
  commissionId,
  commission_type,
  app_fee,
  platform = 'web',
  webReturnUrl = null
) => {
  if (!phoneNumber || !amount || !tx_ref || !email) {
    console.error("Missing Required fields");
  }
  const url = "https://api.chapa.co/v1/transaction/initialize";
  try {
    // Build a return_url that already contains both commission_id and tx_ref.
    // This prevents the provider from appending another `?` and producing a malformed querystring.
    const returnUrlBase = webReturnUrl || `${process.env.WEB_URL || 'http://localhost:5173'}/verify-payment`;
    const return_url = `${returnUrlBase.includes('?') ? returnUrlBase + '&' : returnUrlBase + '?'}commission_id=${encodeURIComponent(commissionId)}&tx_ref=${encodeURIComponent(tx_ref)}&platform=${platform}`;

    const reqBody = {
      first_name: firstName || "",
      last_name: lastName || "",
      email,
      user_type: userType || "",
      phone_number: phoneNumber,
      amount: amount,
      tx_ref: tx_ref,
      currency: "ETB",
      callback_url: process.env.CALLBACK_URL || `https://convivial-theressa-discordantly.ngrok-free.dev/api/commissions/webhook`,
      return_url, // Always a valid HTTP URL
      customization: {
        title: "BIMS Payment",
        description: `Paying as ${partyType}`,
      },
      // Critical: Send metadata
      meta: {
        commissionId,
        partyType,        // 'client' or 'owner'
        userType,
        initiatedBy: userType,
        app_fee,
        commission_type,
        platform, // Track which platform initiated payment
      }
    };

    opt.url = url;

    const res = await axios.post(opt.url, reqBody, {
      headers: opt.headers,
    });

    console.log(res.data);

    return {
      url: res.data.data.checkout_url,
    };
  } catch (error) {
    console.error("❌ Initialization failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
    return null;
  }
};
export const verify = async (tx_ref) => {
  if (!tx_ref) return console.error("missing tx_ref");

  const url = `https://api.chapa.co/v1/transaction/verify`;
  opt.url = url;

  try {
    const res = await axios.get(`${url}/${tx_ref}`, {
      headers: opt.headers,
    });
    console.log("Chapa Verify Response:", JSON.stringify(res.data, null, 2));

    // Return the full data or specifically the status string
    // Chapa structure: { status: 'success', message: '...', data: { status: 'success', ... } }
    return res.data;
  } catch (error) {
    console.error("Failed to verify transaction", error.message);
    if (error.response) {
      console.error("Chapa Error Response:", error.response.data);
    }
    return null;
  }
};