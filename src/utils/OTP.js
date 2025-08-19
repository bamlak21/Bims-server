import { MailtrapClient } from "mailtrap";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.MAILTRAP_TOKEN) {
  throw new Error("Mailtrap Token missing");
}

function generateOtp() {
  return Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
}

export async function send(receiverEmail) {
  const SENDER_EMAIL = "hello@nileode.com";
  const otp = generateOtp();
  const sender = { name: "Bamlak", email: SENDER_EMAIL };
  const client = new MailtrapClient({ token: Token });

  try {
    const res = await client.send({
      from: sender,
      to: [{ email: receiverEmail }],
      subject: "Email verification",
      text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
    });
    console.log(res);
  } catch (err) {
    console.log(err);
  }
}
