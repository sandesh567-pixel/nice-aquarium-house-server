// Centralizes all outgoing order-notification email logic via Brevo's HTTP API.
// Render's free tier blocks outbound SMTP ports (25/465/587), so this uses
// Brevo's transactional email REST API over HTTPS instead of SMTP/nodemailer.
// Callers in orderController.js call these without awaiting inside the
// response path and attach their own .catch() logger, so an email failure
// can never affect order creation or status updates.
//
// Required environment variables:
//   BREVO_API_KEY   - Brevo v3 API key (SMTP & API -> API Keys; NOT the SMTP key)
//   SENDER_EMAIL    - a sender address verified in Brevo (Senders & IP -> Senders)
//   OWNER_EMAIL     - where new-order alerts are delivered
// Optional:
//   GOOGLE_REVIEW_URL - real Google review link; the review section of the
//                       Delivered email is omitted until this is set.

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'
const SENDER_NAME = 'Nice Aquarium House'
const SHOP_TIME_ZONE = 'Asia/Kathmandu' // Render servers run in UTC

async function sendViaBrevo({ to, toName, subject, html, text }) {
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.SENDER_EMAIL

  if (!apiKey || !senderEmail) {
    throw new Error('Email is not configured — set BREVO_API_KEY and SENDER_EMAIL in the server environment.')
  }

  // Brevo requires htmlContent when no templateId is used, so every email
  // passes an html body; textContent is an optional plain-text alternative.
  const payload = {
    sender: { name: SENDER_NAME, email: senderEmail },
    to: [toName ? { email: to, name: toName } : { email: to }],
    subject,
    htmlContent: html,
  }
  if (text) payload.textContent = text

  const res = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Brevo API error (${res.status}): ${errText}`)
  }
}

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function money(amount) {
  return `Rs. ${Number(amount).toLocaleString('en-IN')}`
}

function formatDateTime(date) {
  return new Date(date).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: SHOP_TIME_ZONE,
  })
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: SHOP_TIME_ZONE,
  })
}

// ---------------------------------------------------------------------------
// Owner: new-order alert
// ---------------------------------------------------------------------------

function ownerEmailText(order) {
  const lines = [
    'A new order has been placed.',
    '',
    `Order #${order.orderNumber}`,
    `Date: ${formatDateTime(order.createdAt)}`,
    `Status: ${order.status}`,
    '',
    'Customer:',
    `  Name: ${order.customer.fullName}`,
    `  Email: ${order.customer.email}`,
    `  Phone: ${order.customer.phone}`,
    '',
    'Items:',
    ...order.items.map((i) => `  - ${i.name} x${i.qty} — ${money(i.price * i.qty)}`),
    '',
    `Subtotal: ${money(order.subtotal)}`,
    `Delivery: ${money(order.deliveryCharge)}`,
    `Total: ${money(order.total)}`,
  ]
  if (order.deliveryAddress) {
    lines.push(
      '',
      'Delivery Address:',
      `${order.deliveryAddress.address}, ${order.deliveryAddress.city} ${order.deliveryAddress.postalCode}`
    )
    if (order.deliveryAddress.instructions) lines.push(`Instructions: ${order.deliveryAddress.instructions}`)
  }
  return lines.join('\n')
}

function ownerEmailHtml(order) {
  const cell = 'padding:6px 8px; border-bottom:1px solid #e7efee;'
  const rows = order.items
    .map(
      (i) => `
        <tr>
          <td style="${cell}">${esc(i.name)}</td>
          <td style="${cell} text-align:center;">${esc(i.qty)}</td>
          <td style="${cell} text-align:right;">${esc(money(i.price))}</td>
          <td style="${cell} text-align:right;">${esc(money(i.price * i.qty))}</td>
        </tr>`
    )
    .join('')

  let addressHtml = ''
  if (order.deliveryAddress) {
    const a = order.deliveryAddress
    addressHtml = `
      <h3 style="margin:20px 0 8px;">Delivery Address</h3>
      <p style="margin:0;">${esc(a.address)}, ${esc(a.city)} ${esc(a.postalCode)}</p>
      ${a.instructions ? `<p style="margin:6px 0 0;"><strong>Instructions:</strong> ${esc(a.instructions)}</p>` : ''}
    `
  }

  return emailShell(`
    <h2 style="margin:0 0 4px;">🐠 New Order #${esc(order.orderNumber)}</h2>
    <p style="margin:0 0 16px; color:#557;">${esc(formatDateTime(order.createdAt))} · Status: ${esc(order.status)}</p>

    <h3 style="margin:20px 0 8px;">Customer</h3>
    <p style="margin:0;"><strong>Name:</strong> ${esc(order.customer.fullName)}</p>
    <p style="margin:0;"><strong>Email:</strong> ${esc(order.customer.email)}</p>
    <p style="margin:0;"><strong>Phone:</strong> ${esc(order.customer.phone)}</p>

    <h3 style="margin:20px 0 8px;">Items</h3>
    <table style="width:100%; border-collapse:collapse; font-size:14px;">
      <tr>
        <th style="${cell} text-align:left;">Product</th>
        <th style="${cell} text-align:center;">Qty</th>
        <th style="${cell} text-align:right;">Price</th>
        <th style="${cell} text-align:right;">Total</th>
      </tr>
      ${rows}
    </table>

    <p style="margin:16px 0 0; text-align:right;">Subtotal: ${esc(money(order.subtotal))}</p>
    <p style="margin:2px 0 0; text-align:right;">Delivery: ${esc(money(order.deliveryCharge))}</p>
    <p style="margin:6px 0 0; text-align:right; font-size:16px;"><strong>Total: ${esc(money(order.total))}</strong></p>
    ${addressHtml}
  `)
}

export async function sendNewOrderEmail(order) {
  const ownerEmail = process.env.OWNER_EMAIL
  if (!ownerEmail) {
    throw new Error('OWNER_EMAIL is not set — cannot send new-order notification.')
  }
  await sendViaBrevo({
    to: ownerEmail,
    subject: `New Order #${order.orderNumber} - Nice Aquarium House`,
    html: ownerEmailHtml(order),
    text: ownerEmailText(order),
  })
}

// ---------------------------------------------------------------------------
// Customer: order-status emails (English + Nepali)
// ---------------------------------------------------------------------------

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

// Delivered email only. Omitted entirely until a real https:// review link is
// configured, so customers never see a placeholder or a broken button.
function googleReviewBlock() {
  const url = process.env.GOOGLE_REVIEW_URL
  if (!url || !/^https?:\/\//i.test(url)) return ''
  return `
    <hr style="border:none; border-top:1px solid #e7efee; margin:20px 0;" />
    <h3 style="margin:0 0 8px;">⭐ We’d Love to Hear From You</h3>
    <p>We hope you enjoyed your experience with Nice Aquarium House. If you have a moment, we would truly appreciate your feedback. Your review helps us improve our service and helps other aquarium lovers discover us.</p>
    <p>तपाईंलाई Nice Aquarium House सँगको अनुभव राम्रो लागेको छ भन्ने हाम्रो आशा छ। केही समय निकालेर आफ्नो अनुभवबारे समीक्षा लेखिदिनुभयो भने हामी धेरै आभारी हुनेछौँ। तपाईंको प्रतिक्रियाले हामीलाई अझ राम्रो सेवा दिन र अन्य एक्वेरियम प्रेमीहरूलाई हामीसम्म पुग्न मद्दत गर्छ।</p>
    <p style="text-align:center; margin:20px 0;"><a href="${esc(url)}" style="background:#157A78; color:#ffffff; padding:12px 24px; border-radius:24px; text-decoration:none; font-weight:bold; display:inline-block;">⭐ Leave a Google Review</a></p>
  `
}

function commonFields(order) {
  return {
    customerName: esc(order.customer.fullName),
    orderNumber: esc(order.orderNumber),
    orderDate: esc(formatDate(order.createdAt)),
    totalAmount: esc(Number(order.total).toLocaleString('en-IN')),
  }
}

// One entry per status that sends a customer email. Wording is intentionally
// not shared across statuses — each has its own exact text.
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
          ['Next Update', 'You will receive another email when the order status changes.'],
        ])}
        <p>Your items have been checked and packed carefully. Your order is now ready for the delivery process. You will receive another email when your order is sent for delivery.</p>
        <p>तपाईंका सामानहरू जाँच गरी सावधानीपूर्वक प्याक गरिएको छ। तपाईंको अर्डर अब डेलिभरी प्रक्रियाका लागि तयार छ। अर्डर डेलिभरीका लागि पठाइएपछि तपाईंलाई फेरि इमेल पठाइनेछ।</p>
        ${reminderBlock()}
        ${thankYouBlock(
          '💙 Thank You',
          '<strong>Thank you for choosing Nice Aquarium House!</strong> We appreciate your trust and are happy to prepare your order for you. Your order is now ready for the next stage.',
          '<strong>Nice Aquarium House रोज्नुभएकोमा धेरै धन्यवाद!</strong> तपाईंको विश्वासका लागि हामी आभारी छौँ र तपाईंको अर्डर तयार गर्न पाउँदा खुसी छौँ। तपाईंको अर्डर अब अर्को चरणका लागि तयार छ। 🐠🌿'
        )}
      `),
    }
  },

  'Out for Delivery': (order) => {
    const { customerName, orderNumber, orderDate, totalAmount } = commonFields(order)
    return {
      subject: `🚚 Order Out for Delivery — #${order.orderNumber}`,
      html: emailShell(`
        <h2 style="margin:0 0 16px;">🚚 Order Out for Delivery — अर्डर डेलिभरीका लागि पठाइएको छ</h2>
        <p>Hello ${customerName},</p>
        <p>Your order <strong>#${orderNumber}</strong> is now <strong>out for delivery</strong>! 🚚</p>
        ${summaryBlock([
          ['Order Number', `#${orderNumber}`],
          ['Status', '🚚 Out for Delivery'],
          ['Order Date', orderDate],
          ['Total Amount', `Rs. ${totalAmount}`],
          ['Current Step', 'Your order is on its way.'],
          ['Next Step', 'Please be available to receive your order.'],
          ['Next Update', 'You will receive another email when your order is delivered.'],
        ])}
        <p>Your order has been handed over for delivery and is now on its way to you. Please be available to receive your order.</p>
        <p>तपाईंको अर्डर डेलिभरीका लागि पठाइएको छ र अब तपाईंको ठेगानातर्फ आउँदैछ। कृपया अर्डर प्राप्त गर्न उपलब्ध रहनुहोस्।</p>
        ${reminderBlock()}
        ${thankYouBlock(
          '💙 Thank You',
          '<strong>Thank you for choosing Nice Aquarium House!</strong> We hope your order reaches you safely and brings you happiness. Thank you for trusting us with your aquarium needs. 🐠🌿',
          '<strong>Nice Aquarium House रोज्नुभएकोमा धेरै धन्यवाद!</strong> तपाईंको अर्डर सुरक्षित रूपमा तपाईं कहाँ पुगोस र तपाईंलाई खुसी प्रदान गरोस् भन्ने हाम्रो शुभकामना। तपाईंको एक्वेरियमसम्बन्धी आवश्यकताका लागि हामीमाथि विश्वास गर्नुभएकोमा धन्यवाद। 🐠🌿'
        )}
      `),
    }
  },

  Delivered: (order) => {
    const { customerName, orderNumber, orderDate, totalAmount } = commonFields(order)
    return {
      subject: `🎉 Order Delivered — #${order.orderNumber}`,
      html: emailShell(`
        <h2 style="margin:0 0 16px;">🎉 Order Delivered — अर्डर डेलिभर भयो</h2>
        <p>Hello ${customerName},</p>
        <p>Your order <strong>#${orderNumber}</strong> has been successfully <strong>delivered</strong>.</p>
        ${summaryBlock([
          ['Order Number', `#${orderNumber}`],
          ['Status', '🎉 Delivered'],
          ['Order Date', orderDate],
          ['Total Amount', `Rs. ${totalAmount}`],
          ['Delivery Status', 'Successfully delivered'],
          ['Order Completed', '✅ Yes'],
        ])}
        <p>Your order has been successfully delivered. We hope you are happy with your purchase and enjoy your fish and aquarium products.</p>
        <p>तपाईंको अर्डर सफलतापूर्वक डेलिभर गरिएको छ। तपाईं आफ्नो खरिदसँग खुसी हुनुहुन्छ र तपाईंले खरिद गर्नुभएको माछा तथा एक्वेरियमका सामानहरूको आनन्द लिनुहुनेछ भन्ने हाम्रो आशा छ।</p>
        ${reminderBlock()}
        ${thankYouBlock(
          '💙 Thank You &amp; Welcome Again!',
          '<strong>Thank you for choosing Nice Aquarium House!</strong> We truly appreciate your trust and support. We hope you are happy with your purchase. Whenever you need healthy fish, quality aquarium products, or anything for your aquarium, <strong>Nice Aquarium House is always happy to serve you again.</strong> We look forward to seeing you again! 🐠🌿',
          '<strong>Nice Aquarium House रोज्नुभएकोमा धेरै धन्यवाद!</strong> तपाईंको विश्वास र साथका लागि हामी हृदयदेखि आभारी छौँ। तपाईं आफ्नो खरिदसँग खुसी हुनुहुन्छ भन्ने हाम्रो आशा छ। स्वस्थ माछा, गुणस्तरीय एक्वेरियम सामग्री वा एक्वेरियमसँग सम्बन्धित कुनै पनि सामान आवश्यक पर्दा <strong>Nice Aquarium House मा तपाईंलाई सधैँ हार्दिक स्वागत छ।</strong> फेरि पनि तपाईंलाई सेवा गर्ने अवसरको प्रतीक्षामा छौँ! 🐠🌿'
        )}
        ${googleReviewBlock()}
      `),
    }
  },

  Cancelled: (order) => {
    const { customerName, orderNumber, orderDate, totalAmount } = commonFields(order)
    return {
      subject: `❌ Order Cancelled — #${order.orderNumber}`,
      html: emailShell(`
        <h2 style="margin:0 0 16px;">❌ Order Cancelled — अर्डर रद्द गरिएको छ</h2>
        <p>Hello ${customerName},</p>
        <p>Your order <strong>#${orderNumber}</strong> has been <strong>cancelled</strong>.</p>
        ${summaryBlock([
          ['Order Number', `#${orderNumber}`],
          ['Status', '❌ Cancelled'],
          ['Order Date', orderDate],
          ['Total Amount', `Rs. ${totalAmount}`],
          ['Order Status', 'Cancelled'],
        ])}
        <p>Your order has been cancelled and will not proceed to the next delivery stage. If you believe this cancellation was made by mistake or you need further information, please contact Nice Aquarium House.</p>
        <p>तपाईंको अर्डर रद्द गरिएको छ र अब यो डेलिभरीको अर्को चरणमा जाने छैन। यदि यो अर्डर गल्तीले रद्द भएको हो वा तपाईंलाई थप जानकारी आवश्यक छ भने कृपया <strong>Nice Aquarium House</strong> मा सम्पर्क गर्नुहोस्।</p>
        ${reminderBlock()}
        ${thankYouBlock(
          '💙 Thank You',
          '<strong>Thank you for considering Nice Aquarium House!</strong> We hope to have the opportunity to serve you again in the future.',
          '<strong>Nice Aquarium House लाई रोज्नुभएकोमा धन्यवाद।</strong> भविष्यमा फेरि तपाईंलाई सेवा गर्ने अवसर पाउने आशा राख्दछौँ। 🐠🌿'
        )}
      `),
    }
  },
}

export async function sendOrderStatusEmail(order, newStatus) {
  const buildTemplate = STATUS_TEMPLATES[newStatus]
  if (!buildTemplate) {
    // No customer email is defined for this status (e.g. Pending) — nothing to send.
    return
  }
  if (!order.customer?.email) {
    throw new Error(`Order ${order.orderNumber} has no customer email — cannot send status notification.`)
  }
  const { subject, html } = buildTemplate(order)
  await sendViaBrevo({
    to: order.customer.email,
    toName: order.customer.fullName,
    subject,
    html,
  })
}
