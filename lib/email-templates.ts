// Email templates for order lifecycle notifications

export interface OrderData {
  orderNumber: string;
  customerName: string;  // User's actual profile name for greetings
  email: string;
  cardConfig: {
    // Card display names (what appears on the physical card)
    cardFirstName?: string;
    cardLastName?: string;
    // Legacy field names (fallback for backward compatibility)
    firstName: string;
    lastName: string;
    title?: string;
    mobile?: string;
    whatsapp?: boolean;
    logo?: string;
    quantity?: number;
  };
  shipping: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phoneNumber: string;
  };
  pricing: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
  estimatedDelivery?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

const baseEmailStyles = `
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #3730a3 100%); padding: 30px 40px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 28px; margin: 0; font-weight: 700; }
    .header .tagline { color: #e2e8f0; font-size: 14px; margin-top: 5px; }
    .content { padding: 40px; }
    .card-preview { background: #1e293b; border-radius: 12px; padding: 24px; color: #ffffff; margin: 24px 0; text-align: center; }
    .card-name { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
    .card-title { color: #94a3b8; font-size: 14px; margin-bottom: 20px; }
    .card-brand { color: #ef4444; font-size: 16px; font-weight: 700; }
    .order-details { background: #f8fafc; border-radius: 8px; padding: 24px; margin: 24px 0; }
    .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
    .detail-row:last-child { margin-bottom: 0; font-weight: 600; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    .total-row { font-size: 18px; }
    .shipping-address { background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .status-badge { display: inline-block; background: #10b981; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin: 12px 0; }
    .tracking-button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .footer { background: #f8fafc; padding: 30px 40px; text-align: center; color: #64748b; font-size: 14px; }
    .footer-links { margin-top: 20px; }
    .footer-links a { color: #ef4444; text-decoration: none; margin: 0 12px; }
  </style>
`;

export const orderConfirmationEmail = (data: OrderData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmation - Linkist</title>
  ${baseEmailStyles}
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Order Confirmed! 🎉</h1>
      <p class="tagline">Your Linkist NFC card is being prepared</p>
    </div>
    
    <div class="content">
      <p>Hi <strong>${data.customerName}</strong>,</p>
      
      <p>Thank you for your order! We've received your payment and your custom NFC card is now in our production queue.</p>
      
      <div class="status-badge">✓ Order Confirmed</div>
      
      <div class="card-preview">
        <div class="card-name">${data.cardConfig.cardFirstName || data.cardConfig.firstName} ${data.cardConfig.cardLastName || data.cardConfig.lastName}</div>
        <div class="card-title">${data.cardConfig.title || 'Professional'}</div>
        <div class="card-brand">LINKIST</div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">NFC ENABLED</p>
      </div>

      <div class="order-details">
        <h3 style="margin-top: 0; color: #1e293b;">Order Details</h3>
        <div class="detail-row">
          <span>Order Number:</span>
          <strong>${data.orderNumber}</strong>
        </div>
        <div class="detail-row">
          <span>Linkist NFC Card (Qty: ${data.cardConfig.quantity || 1}):</span>
          <span>$${data.pricing.subtotal.toFixed(2)}</span>
        </div>
        <div class="detail-row">
          <span>Shipping:</span>
          <span>$${data.pricing.shipping.toFixed(2)}</span>
        </div>
        <div class="detail-row">
          <span>Tax (5% VAT):</span>
          <span>$${data.pricing.tax.toFixed(2)}</span>
        </div>
        <div class="detail-row total-row">
          <span>Total:</span>
          <span>$${data.pricing.total.toFixed(2)} USD</span>
        </div>
      </div>

      <div class="shipping-address">
        <h4 style="margin-top: 0; color: #1e293b;">Shipping Address</h4>
        <p style="margin: 0; line-height: 1.5;">
          ${data.shipping.fullName}<br>
          ${data.shipping.addressLine1}<br>
          ${data.shipping.addressLine2 ? data.shipping.addressLine2 + '<br>' : ''}
          ${data.shipping.city}, ${data.shipping.state} ${data.shipping.postalCode}<br>
          ${data.shipping.country}
        </p>
      </div>

      <p><strong>What's Next?</strong></p>
      <ul style="color: #64748b;">
        <li>Your card will be printed and programmed (1-2 business days)</li>
        <li>You'll receive a production update email with photos</li>
        <li>Your order will be shipped with tracking information</li>
        <li>Expected delivery: <strong>${data.estimatedDelivery || 'Sep 06, 2025'}</strong></li>
      </ul>

      <p>Questions? Reply to this email or contact our support team.</p>
    </div>

    <div class="footer">
      <p>Thank you for choosing Linkist!</p>
      <div class="footer-links">
        <a href="https://linkist.ai/support">Support</a>
        <a href="https://linkist.ai/tracking">Track Order</a>
        <a href="https://linkist.ai/account">My Account</a>
      </div>
      <p style="margin-top: 20px; color: #94a3b8; font-size: 12px;">
        © 2025 Linkist. All rights reserved.<br>
        You're receiving this email because you placed an order with us.
      </p>
    </div>
  </div>
</body>
</html>
`;

export const inProductionEmail = (data: OrderData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>In Production - Linkist</title>
  ${baseEmailStyles}
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Your Card is Being Made! 🏭</h1>
      <p class="tagline">Production in progress</p>
    </div>
    
    <div class="content">
      <p>Hi <strong>${data.customerName}</strong>,</p>
      
      <p>Great news! Your custom NFC card is now in production. Our team is carefully crafting your card with the highest quality standards.</p>
      
      <div class="status-badge">🏭 In Production</div>
      
      <div class="card-preview">
        <div class="card-name">${data.cardConfig.cardFirstName || data.cardConfig.firstName} ${data.cardConfig.cardLastName || data.cardConfig.lastName}</div>
        <div class="card-title">${data.cardConfig.title || 'Professional'}</div>
        <div class="card-brand">LINKIST</div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">Currently being printed & programmed</p>
      </div>

      <p><strong>Production Process:</strong></p>
      <ul style="color: #64748b;">
        <li>✓ Design finalized and approved</li>
        <li>🔄 High-quality printing in progress</li>
        <li>⏳ NFC chip programming</li>
        <li>⏳ Quality control testing</li>
        <li>⏳ Packaging for shipment</li>
      </ul>

      <div class="order-details">
        <h3 style="margin-top: 0; color: #1e293b;">Order ${data.orderNumber}</h3>
        <div class="detail-row">
          <span>Production started:</span>
          <strong>Today</strong>
        </div>
        <div class="detail-row">
          <span>Expected completion:</span>
          <strong>1-2 business days</strong>
        </div>
        <div class="detail-row">
          <span>Estimated delivery:</span>
          <strong>${data.estimatedDelivery || 'Sep 06, 2025'}</strong>
        </div>
      </div>

      <p>You'll receive another update with tracking information once your card ships!</p>
    </div>

    <div class="footer">
      <p>Crafted with care by the Linkist team</p>
      <div class="footer-links">
        <a href="https://linkist.ai/support">Support</a>
        <a href="https://linkist.ai/tracking">Track Order</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const shippedEmail = (data: OrderData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Shipped - Linkist</title>
  ${baseEmailStyles}
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Your Order is on the Way! 📦</h1>
      <p class="tagline">Tracking information included</p>
    </div>
    
    <div class="content">
      <p>Hi <strong>${data.customerName}</strong>,</p>
      
      <p>Your Linkist NFC card has been carefully packaged and shipped! It's now on its way to you.</p>
      
      <div class="status-badge">📦 Shipped</div>
      
      <div class="order-details">
        <h3 style="margin-top: 0; color: #1e293b;">Shipping Details</h3>
        <div class="detail-row">
          <span>Order Number:</span>
          <strong>${data.orderNumber}</strong>
        </div>
        <div class="detail-row">
          <span>Tracking Number:</span>
          <strong>${data.trackingNumber || '1Z999AA1234567890'}</strong>
        </div>
        <div class="detail-row">
          <span>Carrier:</span>
          <strong>UPS Ground</strong>
        </div>
        <div class="detail-row">
          <span>Expected Delivery:</span>
          <strong>${data.estimatedDelivery || 'Sep 06, 2025'}</strong>
        </div>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.trackingUrl || '#'}" class="tracking-button">Track Your Package</a>
      </div>

      <div class="shipping-address">
        <h4 style="margin-top: 0; color: #1e293b;">Shipping To</h4>
        <p style="margin: 0; line-height: 1.5;">
          ${data.shipping.fullName}<br>
          ${data.shipping.addressLine1}<br>
          ${data.shipping.addressLine2 ? data.shipping.addressLine2 + '<br>' : ''}
          ${data.shipping.city}, ${data.shipping.state} ${data.shipping.postalCode}<br>
          ${data.shipping.country}
        </p>
      </div>

      <p><strong>What to Expect:</strong></p>
      <ul style="color: #64748b;">
        <li>You'll receive delivery notifications from UPS</li>
        <li>Package requires signature upon delivery</li>
        <li>Your NFC card will be ready to use immediately</li>
        <li>Activation instructions included in the package</li>
      </ul>

      <p>Questions about your delivery? Contact UPS directly or reach out to our support team.</p>
    </div>

    <div class="footer">
      <p>Almost there! Your Linkist card is coming soon.</p>
      <div class="footer-links">
        <a href="${data.trackingUrl || '#'}">Track Package</a>
        <a href="https://linkist.ai/support">Support</a>
        <a href="https://linkist.ai/activation">Activation Guide</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const deliveredEmail = (data: OrderData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Package Delivered - Linkist</title>
  ${baseEmailStyles}
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Your Linkist Card Has Arrived! 🎉</h1>
      <p class="tagline">Welcome to the future of networking</p>
    </div>
    
    <div class="content">
      <p>Hi <strong>${data.customerName}</strong>,</p>
      
      <p>Congratulations! Your custom Linkist NFC card has been delivered. You're now ready to network like never before.</p>
      
      <div class="status-badge">✅ Delivered</div>
      
      <div class="card-preview">
        <div class="card-name">${data.cardConfig.cardFirstName || data.cardConfig.firstName} ${data.cardConfig.cardLastName || data.cardConfig.lastName}</div>
        <div class="card-title">${data.cardConfig.title || 'Professional'}</div>
        <div class="card-brand">LINKIST</div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">Ready to use!</p>
      </div>

      <p><strong>Getting Started:</strong></p>
      <ol style="color: #64748b;">
        <li><strong>Activate your card:</strong> Visit <a href="https://linkist.ai/activate" style="color: #ef4444;">linkist.ai/activate</a></li>
        <li><strong>Customize your profile:</strong> Add your contact info, social links, and bio</li>
        <li><strong>Start networking:</strong> Just tap your card on any NFC-enabled phone</li>
        <li><strong>Track interactions:</strong> See who tapped your card in your dashboard</li>
      </ol>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://linkist.ai/activate" class="tracking-button">Activate Your Card</a>
      </div>

      <div class="order-details">
        <h3 style="margin-top: 0; color: #1e293b;">Order Complete</h3>
        <div class="detail-row">
          <span>Order Number:</span>
          <strong>${data.orderNumber}</strong>
        </div>
        <div class="detail-row">
          <span>Delivered to:</span>
          <strong>${data.shipping.fullName}</strong>
        </div>
        <div class="detail-row">
          <span>Card URL:</span>
          <strong>linkist.com/${(data.cardConfig.cardFirstName || data.cardConfig.firstName)?.toLowerCase()}${(data.cardConfig.cardLastName || data.cardConfig.lastName)?.toLowerCase()}</strong>
        </div>
      </div>

      <p><strong>Need Help?</strong></p>
      <ul style="color: #64748b;">
        <li>📱 <a href="https://linkist.ai/activation" style="color: #ef4444;">Activation Guide</a> - Step-by-step setup</li>
        <li>💡 <a href="https://linkist.ai/tips" style="color: #ef4444;">Networking Tips</a> - Make the most of your card</li>
        <li>🎥 <a href="https://linkist.ai/demo" style="color: #ef4444;">Video Tutorial</a> - See it in action</li>
        <li>📞 <a href="https://linkist.ai/support" style="color: #ef4444;">Support</a> - We're here to help</li>
      </ul>

      <p>Welcome to the Linkist community! We can't wait to see how you'll use your new card to grow your network.</p>
    </div>

    <div class="footer">
      <p>Ready to network differently?</p>
      <div class="footer-links">
        <a href="https://linkist.ai/activate">Activate Card</a>
        <a href="https://linkist.ai/support">Support</a>
        <a href="https://linkist.ai/account">My Account</a>
      </div>
      <p style="margin-top: 20px; color: #94a3b8; font-size: 12px;">
        Share your experience! Tag us @linkist on social media.
      </p>
    </div>
  </div>
</body>
</html>
`;

export const receiptEmail = (data: OrderData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - Linkist</title>
  ${baseEmailStyles}
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Payment Receipt 🧾</h1>
      <p class="tagline">Your purchase confirmation</p>
    </div>
    
    <div class="content">
      <p>Hi <strong>${data.customerName}</strong>,</p>
      
      <p>This is your official receipt for order ${data.orderNumber}. Your payment has been processed successfully.</p>
      
      <div class="order-details">
        <h3 style="margin-top: 0; color: #1e293b;">Receipt Details</h3>
        <div class="detail-row">
          <span>Date:</span>
          <strong>${new Date().toLocaleDateString()}</strong>
        </div>
        <div class="detail-row">
          <span>Order Number:</span>
          <strong>${data.orderNumber}</strong>
        </div>
        <div class="detail-row">
          <span>Payment Method:</span>
          <strong>Credit Card ending in ****</strong>
        </div>
      </div>

      <div class="order-details">
        <h3 style="margin-top: 0; color: #1e293b;">Items Purchased</h3>
        <div class="detail-row">
          <span>Linkist NFC Card - ${data.cardConfig.cardFirstName || data.cardConfig.firstName} ${data.cardConfig.cardLastName || data.cardConfig.lastName}</span>
          <span>$${data.pricing.subtotal.toFixed(2)}</span>
        </div>
        <div class="detail-row">
          <span>Shipping & Handling:</span>
          <span>$${data.pricing.shipping.toFixed(2)}</span>
        </div>
        <div class="detail-row">
          <span>Tax (5% VAT):</span>
          <span>$${data.pricing.tax.toFixed(2)}</span>
        </div>
        <div class="detail-row total-row">
          <span>Total Charged:</span>
          <span>$${data.pricing.total.toFixed(2)} USD</span>
        </div>
      </div>

      <div class="shipping-address">
        <h4 style="margin-top: 0; color: #1e293b;">Billing & Shipping Address</h4>
        <p style="margin: 0; line-height: 1.5;">
          ${data.shipping.fullName}<br>
          ${data.shipping.addressLine1}<br>
          ${data.shipping.addressLine2 ? data.shipping.addressLine2 + '<br>' : ''}
          ${data.shipping.city}, ${data.shipping.state} ${data.shipping.postalCode}<br>
          ${data.shipping.country}
        </p>
      </div>

      <p style="color: #64748b; font-size: 14px;">
        Keep this receipt for your records. If you need to return or exchange your item, this email serves as proof of purchase.
      </p>
    </div>

    <div class="footer">
      <p>Thank you for your business!</p>
      <div class="footer-links">
        <a href="https://linkist.ai/support">Support</a>
        <a href="https://linkist.ai/returns">Returns</a>
        <a href="https://linkist.ai/account">My Account</a>
      </div>
      <p style="margin-top: 20px; color: #94a3b8; font-size: 12px;">
        Linkist, Inc. • Tax ID: 12-3456789 • support@linkist.ai
      </p>
    </div>
  </div>
</body>
</html>
`;

// Printer batch email interface
export interface PrinterOrderData {
  orderNumber: string;
  cardConfig: {
    cardFirstName?: string;
    cardLastName?: string;
    firstName?: string;
    lastName?: string;
    title?: string;
    baseMaterial?: string;
    color?: string;
    colour?: string;
    texture?: string;
    pattern?: string | number;
    quantity?: number;
  };
  shipping: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phoneNumber: string;
  };
}

const printerEmailStyles = `
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
    .email-container { max-width: 800px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 25px 40px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 24px; margin: 0; font-weight: 700; }
    .header .tagline { color: #fecaca; font-size: 14px; margin-top: 5px; }
    .content { padding: 30px 40px; }
    .summary-box { background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center; }
    .summary-box h2 { margin: 0; color: #dc2626; font-size: 28px; }
    .summary-box p { margin: 5px 0 0; color: #7f1d1d; }
    .order-card { border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 25px; page-break-inside: avoid; }
    .order-header { background: #1f2937; color: white; margin: -20px -20px 20px -20px; padding: 15px 20px; border-radius: 10px 10px 0 0; }
    .order-header h3 { margin: 0; font-size: 16px; }
    .order-number { color: #9ca3af; font-size: 14px; }
    .specs-grid { display: table; width: 100%; margin-bottom: 20px; }
    .specs-row { display: table-row; }
    .specs-label { display: table-cell; padding: 8px 10px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; color: #374151; width: 35%; }
    .specs-value { display: table-cell; padding: 8px 10px; border: 1px solid #e5e7eb; color: #1f2937; }
    .shipping-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 15px; }
    .shipping-box h4 { margin: 0 0 10px; color: #166534; font-size: 14px; }
    .shipping-box p { margin: 0; line-height: 1.6; color: #15803d; }
    .footer { background: #f1f5f9; padding: 20px 40px; text-align: center; color: #64748b; font-size: 12px; }
    @media print {
      .order-card { page-break-inside: avoid; }
      .email-container { max-width: 100%; }
    }
  </style>
`;

export const printerBatchEmail = (orders: PrinterOrderData[], date: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Print Orders - ${date}</title>
  ${printerEmailStyles}
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🖨️ Linkist Print Orders</h1>
      <p class="tagline">${date}</p>
    </div>

    <div class="content">
      <div class="summary-box">
        <h2>${orders.length} Card${orders.length !== 1 ? 's' : ''} to Print</h2>
        <p>Total quantity: ${orders.reduce((sum, o) => sum + (o.cardConfig.quantity || 1), 0)} cards</p>
      </div>

      ${orders.map((order, index) => `
        <div class="order-card">
          <div class="order-header">
            <h3>Order #${index + 1}</h3>
            <span class="order-number">${order.orderNumber}</span>
          </div>

          <div class="specs-grid">
            <div class="specs-row">
              <div class="specs-label">Name on Card</div>
              <div class="specs-value"><strong>${order.cardConfig.cardFirstName || order.cardConfig.firstName || ''} ${order.cardConfig.cardLastName || order.cardConfig.lastName || ''}</strong></div>
            </div>
            <div class="specs-row">
              <div class="specs-label">Title</div>
              <div class="specs-value">${order.cardConfig.title || 'N/A'}</div>
            </div>
            <div class="specs-row">
              <div class="specs-label">Material</div>
              <div class="specs-value">${order.cardConfig.baseMaterial || 'Standard PVC'}</div>
            </div>
            <div class="specs-row">
              <div class="specs-label">Color</div>
              <div class="specs-value">${order.cardConfig.color || order.cardConfig.colour || 'Default'}</div>
            </div>
            <div class="specs-row">
              <div class="specs-label">Texture</div>
              <div class="specs-value">${order.cardConfig.texture || 'None'}</div>
            </div>
            <div class="specs-row">
              <div class="specs-label">Pattern</div>
              <div class="specs-value">${order.cardConfig.pattern || 'None'}</div>
            </div>
            <div class="specs-row">
              <div class="specs-label">Quantity</div>
              <div class="specs-value"><strong>${order.cardConfig.quantity || 1}</strong></div>
            </div>
          </div>

          <div class="shipping-box">
            <h4>📦 Ship To:</h4>
            <p>
              <strong>${order.shipping.fullName}</strong><br>
              ${order.shipping.addressLine1}<br>
              ${order.shipping.addressLine2 ? order.shipping.addressLine2 + '<br>' : ''}
              ${order.shipping.city}, ${order.shipping.state} ${order.shipping.postalCode}<br>
              ${order.shipping.country}<br>
              📞 ${order.shipping.phoneNumber}
            </p>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="footer">
      <p><strong>Total Cards to Print: ${orders.reduce((sum, o) => sum + (o.cardConfig.quantity || 1), 0)}</strong></p>
      <p>Generated by Linkist System on ${new Date().toLocaleString()}</p>
      <p style="margin-top: 10px;">This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;