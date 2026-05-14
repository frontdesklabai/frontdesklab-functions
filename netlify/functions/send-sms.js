const twilio = require('twilio');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Parse the request body
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }

  // Log the full payload so we can debug
  console.log('Full Vapi payload:', JSON.stringify(body, null, 2));

  // Vapi can send the phone number in several places — check all of them
  const callerPhone =
    body?.message?.toolCallList?.[0]?.function?.arguments?.phone_number ||
    body?.message?.toolCalls?.[0]?.function?.arguments?.phone_number ||
    body?.tool_call?.function?.arguments?.phone_number ||
    body?.function?.arguments?.phone_number ||
    body?.arguments?.phone_number ||
    body?.phone_number ||
    null;

  console.log('Extracted phone number:', callerPhone);

  if (!callerPhone) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'No phone number provided',
        received: body
      })
    };
  }

  // Load credentials from environment variables
  const accountSid   = process.env.TWILIO_ACCOUNT_SID;
  const authToken    = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber   = process.env.TWILIO_PHONE_NUMBER;
  const calendlyLink = process.env.CALENDLY_LINK;

  // Validate env vars are set
  if (!accountSid || !authToken || !fromNumber || !calendlyLink) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server misconfiguration: missing environment variables' })
    };
  }

  const client = twilio(accountSid, authToken);

  try {
    const message = await client.messages.create({
      body: `Hi! Here's your link to book your free 15-min discovery call with FrontDesk Lab:\n\n${calendlyLink}\n\nWe look forward to speaking with you!`,
      from: fromNumber,
      to: callerPhone
    });

    console.log(`SMS sent successfully. SID: ${message.sid}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        result: 'SMS sent successfully',
        messageSid: message.sid
      })
    };

  } catch (err) {
    console.error('Twilio error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
  }
};
