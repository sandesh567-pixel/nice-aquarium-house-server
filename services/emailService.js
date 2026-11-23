// Centralizes all outgoing order-notification email logic via Brevo's HTTP API
// (Render's free tier blocks outbound SMTP ports 25/465/587, so HTTP API is used).
// Callers in orderController.js call these without awaiting inside the response path
// and attach their own .catch() logger so email failures never affect order creation
// or status updates.

async function sendViaBrevo({ to, subject, text, html }) {
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.SENDER_EMAIL || process.env.EMAIL_USER

  if (!apiKey || !senderEmail) {
    throw new Error('Email is not configured — set BREVO_API_KEY and SENDER_EMAIL in Render Environment')
  }

  const payload = {
    sender: { name: 'Nice Aquarium House', email: senderEmail },
    to: [{ email: to }],
    subject,
  }
  if (html) payload.htmlContent = html
  if (text) payload.textContent = text

  const res = await fetch('https://brevo.com', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Brevo API error (${res.status}): ${errText}`)
  }
}

function formatItemsList(order) {
  return order.items
    .map((i) => `  - ${i.name} x${i.qty} — Rs. ${(i.price * i.qty).toLocaleString('en-IN')}`)
    .join('\n')
}

function formatOrderSummary(order) {
  const lines = [
    `Order #${order.orderNumber}`,
    `Date: ${new Date(order.createdAt).toLocaleString()}`,
    '',
    'Items:',
    formatItemsList(order),
    '',
    `Subtotal: Rs. ${order.subtotal.toLocaleString('en-IN')}`,
    `Delivery: Rs. ${order.deliveryCharge.toLocaleString('en-IN')}`,
    `Total: Rs. ${order.total.toLocaleString('en-IN')}`,
  ]
  if (order.deliveryAddress) {
    lines.push(
      '',
      'Delivery Address:',
      `${order.deliveryAddress.address}, ${order.deliveryAddress.city} ${order.deliveryAddress.postalCode}`
    )
    if (order.deliveryAddress.instructions) lines.push(`Instructions: ${order.deliveryAddress.instructions}`)
  }
  lines.push('', `Status: ${order.status}`)
  return lines.join('\n')
}

export async function sendNewOrderEmail(order) {
  const ownerEmail = process.env.OWNER_EMAIL
  if (!ownerEmail) {
    throw new Error('OWNER_EMAIL is not set — cannot send new-order notification.')
  }
  await sendViaBrevo({
    to: ownerEmail,
    subject: `New Order #${order.orderNumber} - Nice Aquarium House`,
    text: [
      'A new order has been placed.',
      '',
      `Customer: ${order.customer.fullName}`,
      `Email: ${order.customer.email}`,
      `Phone: ${order.customer.phone}`,
      '',
      formatOrderSummary(order),
    ].join('\n'),
  })
}

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function emailShell(innerHtml) {
  return `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, Helvetica, sans-serif; background:#f5faf9; padding:24px; color:#0a2a33; line-height:1.5;">
    <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; padding:28px; border:1px solid #e7efee;">
      ${innerHtml}
    </div>
  </body>
</html>`
}

function summaryBlock(rows) {
  const items = rows
    .map(([label, value]) => `<li style="margin-bottom:6px;"><strong>${esc(label)}:</strong> ${value}</li>`)
    .join('')
  return `<h3 style="margin:20px 0 8px;">📋 Order Summary</h3><ul style="padding-left:20px; margin:0 0 16px;">${items}</ul>`
}

function reminderBlock() {
  return `
    <p>Please keep this email for your order information.</p>
    <p><strong>कृपया आफ्नो अर्डरको जानकारीका लागि यो इमेल सुरक्षित राख्नुहोस्।</strong></p>
  `
}

function thankYouBlock(titleHtml, bodyHtmlEn, bodyHtmlNp) {
  return `
    <hr style="border:none; border-top:1px solid #e7efee; margin:20px 0;" />
    <h3 style="margin:0 0 8px;">${titleHtml}</h3>
    <p>${bodyHtmlEn}</p>
    <p>${bodyHtmlNp}</p>
  `
}

function googleReviewBlock() {
  const url = process.env.GOOGLE_REVIEW_URL
  const button = url
    ? `<p style="text-align:center; margin:20px 0;"><a href="${esc(url)}" style="background:#157A78; color:#ffffff; padding:12px 24px; border-radius:24px; text-decoration:none; font-weight:bold; display:inline-block;">⭐ Leave a Google Review</a></p>`
    : `<p style="color:#999; font-style:italic;">(Google Review link not yet configured — set GOOGLE_REVIEW_URL in Render Environment)</p>`
  return `
    <hr style="border:none; border-top:1px solid #e7efee; margin:20px 0;" />
    <h3 style="margin:0 0 8px;">⭐ We’d Love to Hear From You</h3>
    <p>We hope you enjoyed your experience with Nice Aquarium House. If you have a moment, we would truly appreciate your feedback. Your review helps us improve our service and helps other aquarium lovers discover us.</p>
    <p>तपाईंलाई Nice Aquarium House सँगको अनुभव राम्रो लागेको छ भन्ने हाम्रो आशा छ। केही समय निकालेर आफ्नो अनुभवबारे समीक्षा लेखिदिनुभयो भने हामी धेरै आभारी हुनेछौँ। तपाईंको प्रतिक्रियाले हामीलाई अझ राम्रो सेवा दिन र अन्य एक्वेरियम प्रेमीहरूलाई हामीसम्म पुग्न मद्दत गर्छ।</p>
    ${button}
  `
}

function commonFields(order) {
  return {
    customerName: esc(order.customer.fullName),
    orderNumber: esc(order.orderNumber),
    orderDate: esc(new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })),
    totalAmount: esc(order.total.toLocaleString('en-IN')),
  }
}

const STATUS_TEMPLATES = {
  Confirmed: (order) => {
    const { customerName, orderNumber, orderDate, totalAmount } = commonFields(order)
    return {
      subject: `🐠 Order Confirmed — #${order.orderNumber}`,
      html: emailShell(`
        <h2 style="margin:0 0 16px;">🐠 Order Confirmed — अर्डर पुष्टि भयो</h2>
        <p>Hello ${customerName},</p>
        <p>Good news! 🎉 Your order <strong>#${orderNumber}</strong> has been successfully <strong>confirmed by Nice Aquarium House</strong>.</p>
        ${summaryBlock([
          ['Order Number', `#${orderNumber}`],
          ['Status', '✅ Confirmed'],
          ['Order Date', orderDate],
          ['Total Amount', `Rs. ${totalAmount}`],
          ['Next Step', 'Your order will now be prepared.'],
          ['Next Update', 'You will receive another email when your order status changes.'],
        ])}
        <p>Your order has been checked and accepted by Nice Aquarium House. We will now start preparing your order for the next stage. You will receive another email when your order status changes.</p>
        <p>तपाईंको अर्डर जाँच गरी <strong>Nice Aquarium House द्वारा पुष्टि गरिएको छ।</strong> अब हामी तपाईंको अर्डर अर्को चरणका लागि तयार गर्न सुरु गर्नेछौँ। अर्डरको स्थिति परिवर्तन भएपछि तपाईंलाई फेरि इमेल पठाइनेछ।</p>
        ${reminderBlock()}
        ${thankYouBlock(
          '💙 Thank You',
          '<strong>Thank you for choosing Nice Aquarium House!</strong> We truly appreciate your trust and support. Thank you for placing your order with us. We are happy to serve you and will keep you updated about your order.',
          '<strong>Nice Aquarium House रोज्नुभएकोमा धेरै धन्यवाद!</strong> तपाईंको विश्वास र साथका लागि हामी हृदयदेखि आभारी छौँ। हामीसँग अर्डर गर्नुभएकोमा धन्यवाद। तपाईंको अर्डरको अवस्थाबारे हामी तपाईंलाई जानकारी दिइरहनेछौँ। 🐠🌿'
        )}
      `),
    }
  },

  Processing: (order) => {
    const { customerName, orderNumber, orderDate, totalAmount } = commonFields(order)
    return {
      subject: `🔄 Order Processing — #${order.orderNumber}`,
      html: emailShell(`
        <h2 style="margin:0 0 16px;">🔄 Order Processing — अर्डर तयारी हुँदैछ</h2>
        <p>Hello ${customerName},</p>
        <p>Your order <strong>#${orderNumber}</strong> is now being <strong>processed by Nice Aquarium House</strong>.</p>
        ${summaryBlock([
          ['Order Number', `#${orderNumber}`],
          ['Status', '🔄 Processing'],
          ['Order Date', orderDate],
          ['Total Amount', `Rs. ${totalAmount}`],
          ['Current Step', 'Your order is being prepared.'],
          ['Next Update', 'You will receive another email when your order status changes.'],
        ])}
        <p>We have started preparing your order. Our team is currently checking and getting your items ready for the next stage. You will receive another email when your order status changes.</p>
        <p>हामीले तपाईंको अर्डर तयार गर्न सुरु गरेका छौँ। हाम्रो टोलीले तपाईंका सामानहरू जाँच गरी अर्को चरणका लागि तयार गर्दैछ। अर्डरको स्थिति परिवर्तन भएपछि तपाईंलाई फेरि इमेल पठाइनेछ।</p>
        ${reminderBlock()}
        ${thankYouBlock(
          '💙 Thank You',
          '<strong>Thank you for choosing Nice Aquarium House!</strong> We truly appreciate your trust and patience while we prepare your order. We are happy to serve you and will keep you updated throughout the process.',
          '<strong>Nice Aquarium House रोज्नुभएकोमा धेरै धन्यवाद!</strong> तपाईंको अर्डर तयार हुने क्रममा देखाउनुभएको विश्वास र धैर्यताका लागि हामी हृदयदेखि आभारी छौँ। तपाईंलाई सेवा गर्न पाउँदा हामी खुसी छौँ र अर्डरको प्रक्रियाबारे तपाईंलाई जानकारी दिइरहनेछौँ। 🐠🌿'
        )}
      `),
    }
  },

  Packed: (order) => {
    const { customerName, orderNumber, orderDate, totalAmount } = commonFields(order)
    return {
      subject: `📦 Order Packed — #${order.orderNumber}`,
      html: emailShell(`
        <h2 style="margin:0 0 16px;">📦 Order Packed — अर्डर प्याक गरिएको छ</h2>
        <p>Hello ${customerName},</p>
        <p>Great news! 🎉 Your order <strong>#${orderNumber}</strong> has been <strong>packed and is ready for the next stage</strong>.</p>
        ${summaryBlock([
          ['Order Number', `#${orderNumber}`],
          ['Status', '📦 Packed'],
          ['Order Date', orderDate],
          ['Total Amount', `Rs. ${totalAmount}`],
          ['Current Step', 'Your order has been packed.'],
          ['Next Step', 'Your order will be handed over for delivery.'],
