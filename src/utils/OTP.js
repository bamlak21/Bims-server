import { MailtrapClient } from "mailtrap";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.MAILTRAP_TOKEN) {
  throw new Error("Mailtrap Token missing");
}
const Token = process.env.MAILTRAP_TOKEN;
function generateOtp() {
  return Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
}

export async function sendOtp(receiverEmail) {
  const SENDER_EMAIL = "hello@nileode.com";
  const otp = generateOtp();
  const sender = { name: "Bamlak", email: "hello@bamlak.dev" };
  const client = new MailtrapClient({ token: Token });

  try {
    await client.send({
      from: sender,
      to: [{ email: receiverEmail }],
      subject: "Email verification",
      text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
    });
    return otp; // <-- return OTP for storage
  } catch (err) {
    console.log(err);
    throw err;
  }
}
