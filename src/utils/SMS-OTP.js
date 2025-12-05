import twilio from "twilio";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendOtpSMS = async (phoneNumber, otp) => {
  try {
    await twilioClient.messages.create({
      body: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
      to: phoneNumber,               
      from: process.env.TWILIO_PHONE // your Twilio phone number
    });

    return true;
  } catch (err) {
    console.error("Twilio SMS Error:", err);
    return false;
  }
};
