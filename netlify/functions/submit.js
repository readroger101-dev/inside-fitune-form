exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body || '{}');

    const portalId = '8153409';
    const formId = '505fac89-5d3e-4bd9-9f4c-c1590775c438';
    const endpoint = `https://api-eu1.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`;

    const incomingFields = Array.isArray(data.fields) ? data.fields : [];
    const normalizedFields = incomingFields
      .filter((f) => f && typeof f.name === 'string')
      .map((f) => ({
        name: String(f.name).trim(),
        value: f.value == null ? '' : String(f.value).trim(),
      }))
      .filter((f) => f.name.length > 0 && f.value !== '');

    if (!normalizedFields.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No valid fields were provided' }),
      };
    }

    const headers = event.headers || {};
    const forwardedFor =
      headers['x-nf-client-connection-ip'] ||
      headers['X-Nf-Client-Connection-Ip'] ||
      headers['x-forwarded-for'] ||
      headers['X-Forwarded-For'] ||
      '';

    const ipAddress = String(forwardedFor).split(',')[0].trim();

    const payload = {
      submittedAt: Date.now(),
      fields: normalizedFields,
      context: {
        pageUri: data.pageUri || 'https://inside-fitune-form.netlify.app',
        pageName: data.pageName || 'Inside Fitune - Mega Demo',
        ...(ipAddress ? { ipAddress } : {}),
      },
      legalConsentOptions: {
        consent: {
          consentToProcess: true,
          text: 'I agree to allow Fitune to store and process my personal data.',
          communications: [{
            value: true,
            subscriptionTypeId: 999,
            text: 'I agree to receive marketing communications from Fitune.',
          }],
        },
      },
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseText = await res.text();
    console.log('HUBSPOT_STATUS:', res.status);
    console.log('HUBSPOT_BODY:', responseText);

    if (res.ok) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: res.status, body: responseText };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
