import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.CHAPA_TOKEN) {
  throw new Error("Chapa token not found");
}

const Token = process.env.CHAPA_TOKEN;

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
  email
) => {
  if (!phoneNumber || !amount || !tx_ref || !email) {
    console.error("Missing Required fields");
  }
  const url = "https://api.chapa.co/v1/transaction/initialize";
  try {
    // const currentUrl = window.location.href;
    const reqBody = {
      first_name: firstName || "",
      last_name: lastName || "",
      email,
      phone_number: phoneNumber,
      amount: amount,
      tx_ref: tx_ref,
      currency: "ETB",
      // callback_url: `https://c2bf9b560d0a.ngrok-free.app/api/commissions/webhook`,
      return_url: `http://localhost:5173/verify-payment`,
      customization: {
        title: "BIMS Payment",
        description: "Commission payment through Chapa",
      },
    };

    opt.url = url;

    const res = await axios.post(opt.url, reqBody, {
      headers: opt.headers,
    });

    // console.log(res);
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

    return res.status;
  } catch (error) {
    console.error("Failed to verify transaction", error.message);
  }
};
