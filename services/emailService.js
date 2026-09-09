import nodemailer from 'nodemailer'

// Centralizes all outgoing order-notification email logic. Every function
// here can throw (e.g. if SMTP env vars aren't configured, or the send
// itself fails) — callers in orderController.js always call these
// without awaiting inside the response path and attach their own
// .catch() logger, so an email failure can never affect order creation
// or status updates. Email is a notification feature, not part of the
// order's core success path — see AI_CONTINUATION_PROMPT.md.

let transporter = null

function getTransporter() {
  if (transporter) return transporter
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD } = process.env
  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASSWORD) {
    throw new Error('Email is not configured — set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD in server/.env')
  }
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: Number(EMAIL_PORT) === 465, // true for port 465 (implicit TLS); false for 587/other (STARTTLS)
    auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD },
  })
  return transporter
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
  const t = getTransporter()
  await t.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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
    : `<p style="color:#999; font-style:italic;">(Google Review link not yet configured — set GOOGLE_REVIEW_URL in server/.env)</p>`
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

// One entry per status this system ever emails a customer about. Each
// builds the exact subject/body specified for that status — wording is
// intentionally not shared/abstracted across statuses, since the brief
// requires exact per-status text, not a generic template.
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
          'We hope your order reaches you safely and brings you happiness. Thank you for trusting us with your aquarium needs. 🐠🌿',
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
          '💙 Thank You & Welcome Again!',
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
  if (!order.customer?.email) {
    throw new Error(`Order ${order.orderNumber} has no customer email — cannot send status notification.`)
  }
  const buildTemplate = STATUS_TEMPLATES[newStatus]
  if (!buildTemplate) {
    // No customer email is defined for this status (e.g. Pending) — nothing to send.
    return
  }
  const { subject, html } = buildTemplate(order)
  const t = getTransporter()
  await t.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: order.customer.email,
    subject,
    html,
  })
}
