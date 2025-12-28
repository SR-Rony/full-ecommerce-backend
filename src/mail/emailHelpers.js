import moment from "moment";
import nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import ProductModel from "../models/Product.model.js";
import { Encrypted } from "../utils/func.js";
import { toParseObject } from "../utils/index.js";
import { Constants, getConstantsForOrigin } from "./constants.js";
// console.log(process.env)
/*
 * Email Sending Helper Function
 */

const smtpTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
smtpTransporter.use(
  "compile",
  hbs({
    viewEngine: {
      defaultLayout: false,
      partialsDir: "./src/mail/views/email_templates/",
      extname: "handlebars",
      helpers: {
        compareStrings(v1, v2, options) {
          //console.log("Comparing:", v1, v2)
          if (v1 === v2) {
            return options.fn(this);
          }
          return options.inverse(this);
        },
        // Add your helper for multiplying values
        multiply(a, b) {
          return a * b;
        },
        // Add your helper for calculating the total price
        calculateTotal(quantity, cycleQuantity, salePrice) {
          const total = quantity * cycleQuantity * parseFloat(salePrice);
          return total.toFixed(2); // Ensures two decimal places
        },
         eq: (a, b) => a === b
      },
    },
    viewPath: "./src/mail/views/email_templates/",
    extName: ".handlebars",
  })
);
export function sendMailAsync(options) {
  return new Promise((resolve, reject) => {
    smtpTransporter.sendMail(options, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}
export function sendEmailHandler(options) {
  smtpTransporter.sendMail(options, (error, info) => {
    if (error) {
      return console.log(error);
    }
    return console.log("Message sent: %s", info?.messageId);
  });
}

export async function sendOrderShippedMail(order, isAdmin) {
  try {
    let parseData = toParseObject(order);
    //send mail
    let data = {
      ...parseData,
      link: isAdmin
        ? `${process.env.FRONT_END_URL_ADMIN}/admin/orders/all?orderId=${parseData?.order?.orderId}`
        : `${
            getConstantsForOrigin(parseData?.order?.origin)
              .EMAIL_BODY_HB_FRONTEND_HOST_URL
          }/customer/order/details/${parseData?.order?.orderId}`,
      images: Constants.images,
      footer: Constants.email.footer,
      unsubscribe_link:
        getConstantsForOrigin(parseData?.order?.origin)
          .UNSUBSCRIBE_REDIRECT_LINK_HB +
        "/" +
        Encrypted(
          parseData?.order?.customer?._id ||
            parseData?.customer?._id ||
            parseData?.customer ||
            parseData?.email
        ),
    };

    let options = {
      from: process.env.MAIL_FROM_ADDRESS,
      to: isAdmin ? process.env.ADMIN_EMAIL : parseData.shippingInfo.email,
      subject:
        (isAdmin ? "Customer order shipped - " : "") +
        `[H&B] - Your Order #${parseData.order.orderId} Shipped, On the Way!`,
      template: "order_shipped",
      context: {
        data: data,
      },
    };

    await sendMailAsync(options);
  } catch (error) {
    console.log(`An exception occurred to sending verification mail: `, error);
  }
}

export async function sendOrderPackedMail(order, isAdmin) {
  try {
    let parseData = toParseObject(order);

    //send mail
    let data = {
      ...order,
      link: isAdmin
        ? `${process.env.FRONT_END_URL_ADMIN}/admin/orders/all?orderId=${parseData?.order?.orderId}`
        : `${
            getConstantsForOrigin(parseData?.order?.origin)
              .EMAIL_BODY_HB_FRONTEND_HOST_URL
          }/customer/order/details/${parseData?.order?.orderId}`,
      images: Constants.images,
      footer: Constants.email.footer,
      unsubscribe_link:
        getConstantsForOrigin(parseData?.order?.origin)
          .UNSUBSCRIBE_REDIRECT_LINK_HB +
        "/" +
        Encrypted(
          parseData?.order?.customer?._id ||
            parseData?.customer?._id ||
            parseData?.customer ||
            parseData?.email
        ),
    };

    let options = {
      from: process.env.MAIL_FROM_ADDRESS,
      to: isAdmin ? process.env.ADMIN_EMAIL : parseData.shippingInfo.email,
      subject:
        (isAdmin ? "Customer order packed - " : "") +
        `[H&B] - Your Order #${parseData.order.orderId} Now Packed, Awaiting Shipment`,
      template: "order_packed",
      context: {
        data: data,
      },
    };

    await sendMailAsync(options);
  } catch (error) {
    console.log(`An exception occurred to sending verification mail: `, error);
  }
}

export async function sendOrderConfirmedMail(order, isAdmin, freeBuyProduct) {
  let parseData = toParseObject(order);

  try {
    //send mail
    let data = {
      ...parseData,
      link: `${
        getConstantsForOrigin(parseData?.order?.origin)
          .EMAIL_BODY_HB_FRONTEND_HOST_URL
      }/customer/order/details/${parseData?.order?.orderId}`,
      freeBuyProduct,
      images: Constants.images,
      footer: Constants.email.footer,
      unsubscribe_link:
        getConstantsForOrigin(parseData?.order?.origin)
          .UNSUBSCRIBE_REDIRECT_LINK_HB +
        "/" +
        Encrypted(
          parseData?.order?.customer?._id ||
            parseData?.customer?._id ||
            parseData?.customer ||
            parseData?.email
        ),
    };

    let options = {
      from: process.env.MAIL_FROM_ADDRESS,
      to: parseData.shippingInfo.email,
      subject: `[H&B] - Your Order #${parseData.order.orderId} Payment Confirmed`,
      template: "order_confirmed",
      context: {
        data: data,
      },
    };

    await sendMailAsync(options);
  } catch (error) {
    console.log(`An exception occurred to sending verification mail: `, error);
  }
}

export async function sendNewOrderMail(order) {
  try {
    let parseData = toParseObject(order);

    //send mail
    let freeBuyProduct = "";
    if (
      parseData?.order?.freeBuy?.isFreeBuy &&
      parseData?.order?.freeBuy?.freeBuyProduct?.title
    ) {
      const product = await ProductModel.findOne({
        _id:
          parseData?.order?.freeBuy?.freeBuyProduct?.product?._id ||
          parseData?.order?.freeBuy?.freeBuyProduct?.product,
      });
      if (product) {
        freeBuyProduct = `${parseData?.order?.freeBuy?.freeBuyProduct?.title}${
          product?.bundle?.isLimited
            ? ` (${product?.subTitle})`.toUpperCase()
            : ``
        } (FREEBIE)`;
      }
    }

    //send mail
    let data = {
      ...parseData,
      images: Constants.images,
      freeBuyProduct,
      link: `${process.env.FRONT_END_URL_ADMIN}/admin/orders/all?orderId=${parseData?.order?.orderId}`,
      footer: Constants.email.footer,
      unsubscribe_link:
        getConstantsForOrigin(parseData?.order?.origin)
          .UNSUBSCRIBE_REDIRECT_LINK_HB +
        "/" +
        Encrypted(
          parseData?.order?.customer?._id ||
            parseData?.customer?._id ||
            parseData?.customer ||
            parseData?.email
        ),
    };

    let textData = "";
    const dbProducts = await ProductModel.find({
      _id: { $in: order.order.products.map((e) => e.product) },
    }).populate("bundle.products");
    order.order.products.forEach((product, i) => {
      product.product = dbProducts.filter(
        (e) => e._id.toString() == product.product.toString()
      )[0];
      if (product?.product?.bundle?.isLimited == true) {
        product?.product?.bundle?.products.forEach((bundleProduct, i) => {
          textData += `x${
            parseInt(product?.product?.bundle.size) * product?.quantity
          } `;
          textData += `${bundleProduct?.title || ""} (${
            product.quantity > 1 ? `${product.quantity} ` : ""
          }${product?.title || ""})`;
          textData += "\n";
        });
      } else {
        textData += `x${product?.quantity} `;
        textData += `${product?.title || ""}`;
        textData += "\n";

        if (product.cycle?.isCycle) {
          textData += "Cycle Includes:\n";
          product.cycle.cycleIncludes.forEach((e) => {
            textData += `• x${product.quantity * e.quantity} ${e.title}\n`;
          });
          textData += "\n";
        }

        // {{#if this.cycle.isCycle}}
        //         <div class="cycle-products cycle-item">
        //           <p >Cycle Includes:</p>
        //           {{#each this.cycle.cycleIncludes}}
        //           <p>
        //            • x{{multiply ../quantity this.quantity}} {{this.title}} ${{calculateTotal ../quantity this.quantity this.price.sale}}
        //           </p>
        //           {{/each}}
        //         </div>
        //       {{/if}}
      }
    });

    let options = {
      from: process.env.MAIL_FROM_ADDRESS,
      to: process.env.ADMIN_EMAIL,
      subject: `[H&B] - New Order #${parseData?.order?.orderId}`,
      template: "new_order",
      context: {
        data: { ...data, orderItems: textData.split("\n") },
      },
    };

    await sendMailAsync(options);
    await sendOrderConfirmedMail(order, null, freeBuyProduct);
  } catch (error) {
    console.log(`An exception occurred to sending verification mail: `, error);
  }
}

export const PasswordResetMailSender = async (_data) => {
  let parseData = toParseObject(_data);
  console.log("PasswordResetMailSender:: parseData::", parseData);

  try {
    // send mail
    const data = {
      email: parseData.email,
      images: Constants.images,
      footer: Constants.email.footer,
      code: parseData.code,
      unsubscribe_link:
        getConstantsForOrigin(
          parseData?.order?.origin ||
            parseData?.customer?.origin ||
            parseData?.origin
        ).UNSUBSCRIBE_REDIRECT_LINK_HB +
        "/" +
        Encrypted(
          parseData?.order?.customer?._id ||
            parseData?.customer?._id ||
            parseData?.customer ||
            parseData?.email
        ),
    };

    const options = {
      from: process.env.ADMIN_EMAIL,
      to: _data.email,
      subject: "[H&B] - Password Reset",
      template: "password_reset",
      context: {
        data: data,
      },
    };

    const result = await sendMailAsync(options);
    console.log(result);
    return true;
  } catch (error) {
    console.log(
      `An exception occurred while sending the password reset email: `,
      error
    );
  }
};

export const OtpMailSender = async (_data) => {
  let parseData = toParseObject(_data);
  const link = `${
    Constants.EMAIL_BODY_HB_FRONTEND_HOST_URL
  }/auth/otp-verify?email=${parseData?.email || ""}&code=${parseData?.code}`;

  try {
    // send mail
    const data = {
      email: parseData.email,
      images: Constants.images,
      footer: Constants.email.footer,
      link,
      code: parseData.code,
      unsubscribe_link:
        getConstantsForOrigin(
          parseData?.order?.origin ||
            parseData?.customer?.origin ||
            parseData?.origin
        ).UNSUBSCRIBE_REDIRECT_LINK_HB +
        "/" +
        Encrypted(
          parseData?.order?.customer?._id ||
            parseData?.customer?._id ||
            parseData?.customer ||
            parseData?.email
        ),
    };

    const options = {
      from: process.env.ADMIN_EMAIL,
      to: parseData.email,
      subject: "[H&B] - OTP one time verification",
      template: "otp_send",
      context: {
        data: data,
      },
    };

    // Use async/await to wait for the Promise to resolve
    const result = await sendMailAsync(options);
    //console.log(result)
    return true;
  } catch (error) {
    console.log(
      `An exception occurred while sending the otp sender email: `,
      error
    );
  }
};

export const PasswordChangeMailSender = async (_data) => {
  try {
    // send mail
    let parseData = toParseObject(_data);
    const data = {
      email: parseData.email,
      images: Constants.images,
      footer: Constants.email.footer,
      name: parseData.name,
      unsubscribe_link:
        getConstantsForOrigin(
          parseData?.order?.origin ||
            parseData?.customer?.origin ||
            parseData?.origin
        ).UNSUBSCRIBE_REDIRECT_LINK_HB +
        "/" +
        Encrypted(
          parseData?.order?.customer?._id ||
            parseData?.customer?._id ||
            parseData?.customer ||
            parseData?.email
        ),
    };

    const options = {
      from: process.env.ADMIN_EMAIL,
      to: parseData.email,
      subject: "[H&B] - Your password was set",
      template: "password_set",
      context: {
        data: data,
      },
    };

    // Use async/await to wait for the Promise to resolve
    const result = await sendMailAsync(options);
    console.log(result);
    return true;
  } catch (error) {
    console.log(
      `An exception occurred while sending the Password set sender email: `,
      error
    );
  }
};

export const ContactUsMailSender = async (_data) => {
  try {
    let parseData = toParseObject(_data);
    // send mail
    const data = {
      email: parseData.email,
      images: Constants.images,
      footer: Constants.email.footer,
      unsubscribe_link:
        getConstantsForOrigin(
          parseData?.order?.origin ||
            parseData?.customer?.origin ||
            parseData?.origin
        ).UNSUBSCRIBE_REDIRECT_LINK_HB +
        "/" +
        Encrypted(
          parseData?.order?.customer?._id ||
            parseData?.customer?._id ||
            parseData?.customer ||
            parseData?.email
        ),
    };

    const options = {
      from: process.env.ADMIN_EMAIL,
      to: parseData.email,
      subject: "[H&B] - New Contact Request",
      template: "customer_contact",
      context: {
        data: data,
      },
    };

    // Use async/await to wait for the Promise to resolve
    const result = await sendMailAsync(options);
    console.log(result);
    return true;
  } catch (error) {
    console.log(
      `An exception occurred while sending the Password set sender email: `,
      error
    );
  }
};

export async function SendContactUsMailAdmin(_data, subject) {
  try {
    let parseData = toParseObject(_data);
    let options = {
      from: process.env.MAIL_FROM_ADDRESS,
      to: process.env.CONTACT_TO_EMAIL,
      subject: `[H&B] - ${subject || "New Contact Request"}`,
      template: "contact_us",
      context: {
        data: parseData,
      },
    };

    const result = await sendMailAsync(options);
    console.log(result);
    return true;
  } catch (error) {
    console.log(`Error when sending conatus mail`, error);
  }
}

export async function sendPaidLessAmountMail(order, actually_paid, pay_amount) {
  try {
    let parseData = toParseObject(order);
    //send mail
    let data = {
      ...parseData,
      link: `${process.env.FRONT_END_URL_ADMIN}/admin/orders/all?orderId=${parseData?.order?.orderId}`,
      //link: `${Constants.EMAIL_BODY_HB_FRONTEND_HOST_URL}/customer/order/details/${parseData?.order?.orderId}`,
      images: Constants.images,
      footer: Constants.email.footer,
      actually_paid,
      pay_amount,
      unsubscribe_link:
        getConstantsForOrigin(
          parseData?.order?.origin ||
            parseData?.customer?.origin ||
            parseData?.origin
        ).UNSUBSCRIBE_REDIRECT_LINK_HB +
        "/" +
        Encrypted(
          parseData?.order?.customer?._id ||
            parseData?.customer?._id ||
            parseData?.customer ||
            parseData?.email
        ),
    };

    let options = {
      from: process.env.MAIL_FROM_ADDRESS,
      to: process.env.ADMIN_EMAIL,
      subject: `[H&B] - Customer Paid Less Amount For Order #${parseData.order.orderId}`,
      template: "paid_less",
      context: {
        data: data,
      },
    };

    const result = await sendMailAsync(options);
    console.log(result);
    return true;
  } catch (error) {
    console.log(`An exception occurred to sending verification mail: `, error);
  }
}

export async function sendPaymentFailedMail(order) {
  try {
    //send mail
    let parseData = toParseObject(order);
    let data = {
      ...parseData,
      link: `${
        getConstantsForOrigin(
          parseData?.order?.origin ||
            parseData?.customer?.origin ||
            parseData?.origin
        ).EMAIL_BODY_HB_FRONTEND_HOST_URL
      }/customer/order/details/${parseData?.order?.orderId}`,
      images: Constants.images,
      footer: Constants.email.footer,
      unsubscribe_link:
        getConstantsForOrigin(
          parseData?.order?.origin ||
            parseData?.customer?.origin ||
            parseData?.origin
        ).UNSUBSCRIBE_REDIRECT_LINK_HB +
        "/" +
        Encrypted(
          parseData?.order?.customer?._id ||
            parseData?.customer?._id ||
            parseData?.customer ||
            parseData?.email
        ),
    };

    let options = {
      from: process.env.MAIL_FROM_ADDRESS,
      to: parseData.shippingInfo.email,
      subject: `[H&B] - Your Payment is ${parseData.order.payment.status} For Order #${parseData.order.orderId}`,
      template: "payment_failed",
      context: {
        data: data,
      },
    };

    const result = await sendMailAsync(options);
    console.log(result);
    return true;
  } catch (error) {
    console.log(`An exception occurred to sending verification mail: `, error);
  }
}

export async function sendOrderCommentSendMailToCustomer(_data) {
  try {
    let parseData = toParseObject(_data);
    const data = {
      ...parseData,
      link: `${process.env.FRONT_END_URL_ADMIN}/admin/orders/all?orderId=${parseData?.orderId}&comment=true`,
      subject:
        "[H&B] - New Comment for Customer Order" + " #" + parseData?.orderId,
      images: Constants.images,
      footer: Constants.email.footer,
    };
    let options = {
      from: process.env.ADMIN_EMAIL,
      to: process.env.CONTACT_TO_EMAIL,
      subject:
        "[H&B] - New Comment for Customer Order" + " #" + parseData?.orderId,
      template: "order_comment-send_mail",
      context: {
        data,
      },
    };

    const result = sendEmailHandler(options);
    return result;
  } catch (error) {
    console.log(`Error when sending comment mail`, error);
  }
}

export const customerOrderReviewAndSendMailToAdmin = (_data) => {
  try {
    let parseData = toParseObject(_data);
    const data = {
      ...parseData,
      link: `${process.env.FRONT_END_URL_ADMIN}/admin/orders/all?orderId=${parseData?.orderId}`,
      subject:
        "[H&B] - New Review Added From Customer Order" +
        " #" +
        parseData?.orderId,
      images: Constants.images,
      footer: Constants.email.footer,
      unsubscribe_link:
        getConstantsForOrigin(
          parseData?.order?.origin ||
            parseData?.customer?.origin ||
            parseData?.origin
        ).UNSUBSCRIBE_REDIRECT_LINK_HB +
        "/" +
        Encrypted(
          parseData?.order?.customer?._id ||
            parseData?.customer?._id ||
            parseData?.customer ||
            parseData?.email
        ),
    };
    let options = {
      from: process.env.ADMIN_EMAIL,
      to: process.env.CONTACT_TO_EMAIL,
      subject:
        "[H&B] - New Review Added From Customer Order" +
        " #" +
        parseData?.orderId,
      template: "order_review_to_mail_send_admin",
      context: {
        data,
      },
    };

    const result = sendEmailHandler(options);
    return result;
  } catch (error) {
    console.log(`Error when sending review mail`, error);
  }
};

export async function sendAccountApprovedMail(userData) {
  try {
    let parseData = toParseObject(userData);

    // send mail
    let data = {
      customerName: parseData.name || parseData.email,
      loginLink: `${
        getConstantsForOrigin(parseData?.origin).EMAIL_BODY_HB_FRONTEND_HOST_URL
      }/auth/login`,
      images: Constants.images,
      footer: Constants.email.footer,
      unsubscribe_link:
        getConstantsForOrigin(parseData?.origin).UNSUBSCRIBE_REDIRECT_LINK_HB +
        "/" +
        Encrypted(parseData?._id || parseData?.email),
    };

    let options = {
      from: process.env.MAIL_FROM_ADDRESS,
      to: parseData.email,
      subject: "[H&B] - Your Account Has Been Approved – Welcome!",
      template: "account_approved",
      context: {
        data: data,
      },
    };

    const result = await sendMailAsync(options);
    console.log("Account approval email sent:", result);
    return true;
  } catch (error) {
    console.log(
      "An exception occurred while sending account approval email:",
      error
    );
    return false;
  }
}

export async function sendAccountUnderReviewMail(userData) {
  try {
    let parseData = toParseObject(userData);

    // send mail
    let data = {
      customerName: parseData.name || parseData.email,
      images: Constants.images,
      footer: Constants.email.footer,
      unsubscribe_link:
        getConstantsForOrigin(parseData?.origin).UNSUBSCRIBE_REDIRECT_LINK_HB +
        "/" +
        Encrypted(parseData?._id || parseData?.email),
    };

    let options = {
      from: process.env.MAIL_FROM_ADDRESS,
      to: parseData.email,
      subject: "[H&B] - Your Account is Under Review",
      template: "account_under_review",
      context: {
        data: data,
      },
    };

    const result = await sendMailAsync(options);
    console.log("Account under review email sent:", result);
    return true;
  } catch (error) {
    console.log(
      "An exception occurred while sending account under review email:",
      error
    );
    return false;
  }
}

export async function sendCustomerPendingAccountApprovalMailByAdmin(userData) {
  try {
    let parseData = toParseObject(userData);
    const constants = getConstantsForOrigin(parseData.origin);

    const data = {
      customerName: parseData?.firstName || parseData.email,
      customerEmail: parseData.email,
      registrationTime: moment(parseData.createdAt || new Date()).format(
        "MMMM Do YYYY, h:mm A"
      ),
      images: constants.images,
      adminPortalUrl: `${process.env.FRONT_END_URL_ADMIN}/admin/customers/all/?customerId=${parseData?._id}`,
      footer: constants.email.footer,
      unsubscribe_link:
        getConstantsForOrigin(parseData?.origin).UNSUBSCRIBE_REDIRECT_LINK_HB +
        "/" +
        Encrypted(parseData?._id || parseData?.email),
    };

    const options = {
      from: process.env.MAIL_FROM_ADDRESS,
      to: process.env.ADMIN_EMAIL,
      subject: "[H&B] - New User Account Pending Approval",
      template: "account_under_review_pending_approval_by_admin",
      context: {
        data: data,
      },
    };

    const result = await sendMailAsync(options);
    console.log("Peptide admin notification email sent:", result);
    return true;
  } catch (error) {
    console.log("An exception occurred while sending H&B admin email:", error);
    return false;
  }
}

export async function sendTicketMessageNotification(ticket, isAdmin = false) {
  try {
    let parseData = toParseObject(ticket);
    
    // Get customer email from the ticket if available
    const customerEmail = parseData.customerEmail || parseData?.customer?.email || parseData?.customerId?.email;
    
    // Construct the appropriate link based on recipient
    const link = isAdmin 
      ? `${process.env.FRONT_END_URL_ADMIN}/admin/support?orderId=${parseData.orderId}&ticketId=${parseData._id}&openTicket=true`
      : `${getConstantsForOrigin(parseData?.origin).EMAIL_BODY_HB_FRONTEND_HOST_URL}/customer/order/details/${parseData.orderId}?openTicket=true`;

    // Prepare email data
    const data = {
      orderId: parseData.orderId,
      link,
      images: Constants.images,
      footer: Constants.email.footer,
      unsubscribe_link: getConstantsForOrigin(parseData?.origin).UNSUBSCRIBE_REDIRECT_LINK_HB + 
        "/" + 
        Encrypted(parseData?.customerId || parseData?.customer?._id || customerEmail)
    };

    // Configure email options
    const options = {
      from: process.env.MAIL_FROM_ADDRESS,
      to: isAdmin ? process.env.ADMIN_EMAIL : customerEmail,
      subject: `[H&B] - New Ticket Message for Order #${parseData?.orderId}`,
      template: "ticket_message",
      context: {
        data
      }
    };

    await sendMailAsync(options);
    return true;
  } catch (error) {
    console.log("An exception occurred while sending ticket message notification:", error);
    return false;
  }
}

export async function sendRefundRequestNotification(customer, btcAddress, creditAmount) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    
    const emailData = {
      to: adminEmail,
      from: process.env.MAIL_FROM_ADDRESS,
      subject: `[H&B] - Refund Requested - ${customer.name || customer.email}`,
      template: "refund_request",
      context: {
        customerId: customer._id || customer.id,
        customerName: customer.name || 'Customer',
        customerEmail: customer?.creditBalanceRefund?.email || customer.email,
        btcAddress,
        creditAmount: `$${parseFloat(creditAmount).toFixed(2)}`,
        requestDate: moment().format('MMMM Do YYYY, h:mm a'),
        link: `${process.env.FRONT_END_URL_ADMIN}/admin/wallet/customer/${customer?._id}`,
        currentYear: new Date().getFullYear(),
        siteName: process.env.SITE_NAME || 'HammerAndBell',
        images: Constants.images,
        footer: Constants.email.footer,
        unsubscribe_link: `${getConstantsForOrigin('hb').UNSUBSCRIBE_REDIRECT_LINK_HB}/${Encrypted(customer?._id)}`
      },
    };

    await sendMailAsync(emailData);
    return true;
  } catch (error) {
    console.error('Error sending refund request notification:', error);
    return false;
  }
}
