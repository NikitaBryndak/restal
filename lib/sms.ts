import twilio from 'twilio';

// Google Cloud Platform (GCP) does not have a comprehensive native SMS service.
// GCP officially recommends using third-party partners like Twilio.
// 
// Valid environment variables required in .env.local:
// TWILIO_ACCOUNT_SID=AC...
// TWILIO_AUTH_TOKEN=...
// TWILIO_PHONE_NUMBER=+1234...

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize client only if keys are present to avoid crash on import
const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

export const sendSMS = async (phoneNumber: string, message: string) => {
  if (!client) {
    console.warn("Twilio credentials not found. Skipping SMS send.");
    // We throw to ensure the caller knows it failed, or we can just log.
    // Given the previous architecture, logging (dev flow) vs throwing (prod flow)
    // Let's return a mock result if config is missing to allow 'simulated' flow to continue
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Twilio Mock] Would send to ${phoneNumber}: ${message}`);
        return { sid: 'mock-sid' };
    }
    throw new Error("Twilio credentials are not configured.");
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: phoneNumber,
    });
    
    console.log(`SMS sent to ${phoneNumber}. SID: ${result.sid}`);
    return result;
  } catch (error) {
    console.error(`Failed to send SMS to ${phoneNumber} via Twilio:`, error);
    throw error;
  }
};
