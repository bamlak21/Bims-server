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
  lastName
) => {
  if (!phoneNumber || !amount || !tx_ref) {
    console.error("Missing Required fields");
  }
  const url = "https://api.chapa.co/v1/transaction/initialize";
  try {
    const reqBody = {
      firstName: firstName || "",
      lastName: lastName || "",
      amount: amount,
      tx_ref: tx_ref,
      currency: "ETB",
      callback_url: `http://localhost:5173/payment/success`,
      return_url: `http://localhost:5173/payment/success`,
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
    console.error("Initialization failed", error);
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
