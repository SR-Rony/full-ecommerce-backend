import moment from "moment";
import nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import ProductModel from "../models/Product.model.js";
import { Encrypted } from "../utils/func.js";
import { toParseObject } from "../utils/index.js";
import { AuctropinConstants } from "./AuctropinConstants.js";
// console.log(process.env)
/*
 * Email Sending Helper Function
 */

const auctropinTransporter = nodemailer.createTransport({
  host: process.env.AUCTROPIN_SMTP_HOST,
  port: process.env.AUCTROPIN_SMTP_PORT,
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
  requireTLS: true,
  auth: {
    user: process.env.AUCTROPIN_SMTP_USER,
    pass: process.env.AUCTROPIN_SMTP_PASS,
  },
});
auctropinTransporter.use(
  "compile",
  hbs({
    viewEngine: {
      defaultLayout: false,
      partialsDir: "./src/mail/views/auctropin_email_templates/",
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
      },
    },
    viewPath: "./src/mail/views/auctropin_email_templates/",
    extName: ".handlebars",
  })
);
export function sendMailAsync(options) {
  return new Promise((resolve, reject) => {
    auctropinTransporter.sendMail(options, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}
export function sendEmailHandler(options) {
  auctropinTransporter.sendMail(options, (error, info) => {
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
        : `${process.env.FRONT_END_URL_AUCTROPIN}/customer/order/details/${parseData?.order?.orderId}`,
      images: AuctropinConstants.images,
      footer: AuctropinConstants.email.footer,
      unsubscribe_link:
        process.env.UNSUBSCRIBE_REDIRECT_LINK_AUCTROPIN +
        "/" +
        Encrypted(
          parseData?.order?.customer?._id ||
            parseData?.customer?._id ||
            parseData?.customer ||
            parseData?.email
        ),
    };

    let options = {
      from: process.env.AUCTROPIN_MAIL_FROM_ADDRESS,
      to: isAdmin ? process.env.ADMIN_EMAIL : parseData.shippingInfo.email,
      subject:
        (isAdmin ? "Auctropin customer order shipped - " : "") +
        `Order #${parseData.order.orderId} is now shipped and heading your way!`,
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
        : `${process.env.FRONT_END_URL_AUCTROPIN}/customer/order/details/${parseData?.order?.orderId}`,
      images: AuctropinConstants.images,
      footer: AuctropinConstants.email.footer,
      unsubscribe_link:
        process.env.UNSUBSCRIBE_REDIRECT_LINK_AUCTROPIN +
        "/" +
        Encrypted(
          parseData?.order?.customer?._id ||
            parseData?.customer?._id ||
            parseData?.customer ||
            parseData?.email
        ),
    };

    let options = {
      from: process.env.AUCTROPIN_MAIL_FROM_ADDRESS,
      to: isAdmin ? process.env.ADMIN_EMAIL : parseData.shippingInfo.email,
      subject:
        (isAdmin ? "Auctropin customer order packed - " : "") +
        `Order #${parseData.order.orderId} is now packed and awaiting shipment!`,
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
      link: `${process.env.FRONT_END_URL_AUCTROPIN}/customer/order/details/${parseData?.order?.orderId}`,
      freeBuyProduct,
      images: AuctropinConstants.images,
      footer: AuctropinConstants.email.footer,
      unsubscribe_link:
        process.env.UNSUBSCRIBE_REDIRECT_LINK_AUCTROPIN +
        "/" +
        Encrypted(
          parseData?.order?.customer?._id ||
            parseData?.customer?._id ||
            parseData?.customer ||
            parseData?.email
        ),
    };

    let options = {
      from: process.env.AUCTROPIN_MAIL_FROM_ADDRESS,
      to: parseData.shippingInfo.email,
      subject: `Payment confirmed for Order #${parseData.order.orderId}!`,
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
      images: AuctropinConstants.images,
      freeBuyProduct,
      link: `${process.env.FRONT_END_URL_ADMIN}/admin/orders/all?orderId=${parseData?.order?.orderId}`,
      footer: AuctropinConstants.email.footer,
      unsubscribe_link:
        process.env.UNSUBSCRIBE_REDIRECT_LINK_AUCTROPIN +
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
        textData += `x${product?.quantity || ""} `;
        textData += `${product?.title || ""}`;
        textData += "\n";
      }
    });

    let options = {
      from: process.env.AUCTROPIN_MAIL_FROM_ADDRESS,
      to: process.env.ADMIN_EMAIL,
      subject: `[AUCTROPIN] New Order #${parseData?.order?.orderId}`,
      template: "new_order",
      context: {
        data: {
          ...data,
          orderItems: textData
            .split("\n")
            .map((e) => e.trim())
            .filter((e) => e),
        },
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

  try {
    // send mail
    const data = {
      email: parseData.email,
      images: AuctropinConstants.images,
      footer: AuctropinConstants.email.footer,
      code: parseData.code,
      unsubscribe_link:
        process.env.UNSUBSCRIBE_REDIRECT_LINK_AUCTROPIN +
        "/" +
        Encrypted(
          parseData?.order?.customer?._id ||
            parseData?.customer?._id ||
            parseData?.customer ||
            parseData?.email
        ),
    };

    const options = {
      from: process.env.AUCTROPIN_MAIL_FROM_ADDRESS,
      to: _data.email,
      subject: "Reset Your Password",
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

  try {
    // send mail
    const data = {
      email: parseData.email,
      images: AuctropinConstants.images,
      footer: AuctropinConstants.email.footer,
      code: parseData.code,
      unsubscribe_link:
        process.env.UNSUBSCRIBE_REDIRECT_LINK_AUCTROPIN +
        "/" +
        Encrypted(
          parseData?.order?.customer?._id ||
            parseData?.customer?._id ||
            parseData?.customer ||
            parseData?.email
        ),
    };

    const options = {
      from: process.env.AUCTROPIN_MAIL_FROM_ADDRESS,
      to: parseData.email,
      subject: "One-Time Verification Code (OTP)",
      template: "otp_send",
      context: {
        data: data,
      },
    };

    // Use async/await to wait for the Promise to resolve
   await sendMailAsync(options);
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
      images: AuctropinConstants.images,
      footer: AuctropinConstants.email.footer,
      name: parseData.name,
      unsubscribe_link:
        process.env.UNSUBSCRIBE_REDIRECT_LINK_AUCTROPIN +
        "/" +
        Encrypted(
          parseData?.order?.customer?._id ||
            parseData?.customer?._id ||
            parseData?.customer ||
            parseData?.email
        ),
    };

    const options = {
      from: process.env.AUCTROPIN_MAIL_FROM_ADDRESS,
      to: parseData.email,
      subject: "Your password has been updated",
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
      images: AuctropinConstants.images,
      footer: AuctropinConstants.email.footer,
      unsubscribe_link:
        process.env.UNSUBSCRIBE_REDIRECT_LINK_AUCTROPIN +
        "/" +
        Encrypted(
          parseData?.order?.customer?._id ||
            parseData?.customer?._id ||
            parseData?.customer ||
            parseData?.email
        ),
    };

    const options = {
      from: process.env.AUCTROPIN_MAIL_FROM_ADDRESS,
      to: parseData.email,
      subject: "[AUCTROPIN] New Contact Request",
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
      from: process.env.AUCTROPIN_MAIL_FROM_ADDRESS,
      to: process.env.CONTACT_TO_EMAIL,
      subject: `[AUCTROPIN] ${subject || "New Contact Request"}`,
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
      //link: `${process.env.FRONT_END_URL_AUCTROPIN}/customer/order/details/${parseData?.order?.orderId}`,
      images: AuctropinConstants.images,
      footer: AuctropinConstants.email.footer,
      actually_paid,
      pay_amount,
      unsubscribe_link:
        process.env.UNSUBSCRIBE_REDIRECT_LINK_AUCTROPIN +
        "/" +
        Encrypted(
          parseData?.order?.customer?._id ||
            parseData?.customer?._id ||
            parseData?.customer ||
            parseData?.email
        ),
    };

    let options = {
      from: process.env.AUCTROPIN_MAIL_FROM_ADDRESS,
      to: process.env.ADMIN_EMAIL,
      subject: `[AUCTROPIN] Customer Paid Less Amount For Order #${parseData.order.orderId}`,
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
      link: `${process.env.FRONT_END_URL_AUCTROPIN}/customer/order/details/${parseData?.order?.orderId}`,
      images: AuctropinConstants.images,
      footer: AuctropinConstants.email.footer,
      unsubscribe_link:
        process.env.UNSUBSCRIBE_REDIRECT_LINK_AUCTROPIN +
        "/" +
        Encrypted(
          parseData?.order?.customer?._id ||
            parseData?.customer?._id ||
            parseData?.customer ||
            parseData?.email
        ),
    };

    let options = {
      from: process.env.AUCTROPIN_MAIL_FROM_ADDRESS,
      to: parseData.shippingInfo.email,
      subject: `Payment is ${parseData.order.payment.status} for order #${parseData.order.orderId}`,
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
        "[AUCTROPIN] New Comment for Customer Order" +
        " #" +
        parseData?.orderId,
      images: AuctropinConstants.images,
      footer: AuctropinConstants.email.footer,
      unsubscribe_link:
        process.env.UNSUBSCRIBE_REDIRECT_LINK_AUCTROPIN +
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
        "[AUCTROPIN] New Comment for Customer Order" +
        " #" +
        parseData?.orderId,
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
        "[AUCTROPIN] New Review Added From Customer Order" +
        " #" +
        parseData?.orderId,
      images: AuctropinConstants.images,
      footer: AuctropinConstants.email.footer,
      unsubscribe_link:
        process.env.UNSUBSCRIBE_REDIRECT_LINK_AUCTROPIN +
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
        "[AUCTROPIN] New Review Added From Customer Order" +
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
export async function sendAuctropinAccountApprovedMail(userData) {
  try {
    let parseData = toParseObject(userData);

    // send mail
    let data = {
      customerName:
        parseData?.firstName || parseData?.customerName || parseData.email,
      loginLink: `${AuctropinConstants.EMAIL_BODY_AUCTROPIN_FRONTEND_HOST_URL}/auth/login`,
      images: AuctropinConstants.images,
      footer: AuctropinConstants.email.footer,
      unsubscribe_link:
        process.env.UNSUBSCRIBE_REDIRECT_LINK_AUCTROPIN +
        "/" +
        Encrypted(parseData?._id || parseData?.email),
    };

    let options = {
      from: process.env.MAIL_FROM_ADDRESS,
      to: parseData.email,
      subject: "[AUCTROPIN] - Your Account Has Been Approved – Welcome!",
      template: "auctropin_account_approved",
      context: {
        data: data,
      },
    };

    const result = await sendMailAsync(options);
    console.log("Auctropin account approval email sent:", result);
    return true;
  } catch (error) {
    console.log(
      "An exception occurred while sending Auctropin account approval email:",
      error
    );
    return false;
  }
}

export async function sendAuctropinAccountUnderReviewMail(userData) {
  try {
    let parseData = toParseObject(userData);

    // send mail
    let data = {
      customerName:
        parseData?.firstName || parseData?.customerName || parseData.email,
      images: AuctropinConstants.images,
      footer: AuctropinConstants.email.footer,
      unsubscribe_link:
        process.env.UNSUBSCRIBE_REDIRECT_LINK_AUCTROPIN +
        "/" +
        Encrypted(parseData?._id || parseData?.email),
    };

    let options = {
      from: process.env.MAIL_FROM_ADDRESS,
      to: parseData.email,
      subject: "[AUCTROPIN] - Your Account is Under Review",
      template: "auctropin_account_under_review",
      context: {
        data: data,
      },
    };

    const result = await sendMailAsync(options);
    console.log("Auctropin account under review email sent:", result);
    return true;
  } catch (error) {
    console.log(
      "An exception occurred while sending Auctropin account under review email:",
      error
    );
    return false;
  }
}

export async function sendAuctropinCustomerPendingAccountApprovalMailByAdmin(
  userData
) {
  try {
    let parseData = toParseObject(userData);

    const data = {
      customerName:
        parseData?.firstName || parseData?.customerName || parseData.email,
      customerEmail: parseData.email,
      registrationTime: moment(parseData.createdAt || new Date()).format(
        "MMMM Do YYYY, h:mm A"
      ),
      images: AuctropinConstants.images,
      adminPortalUrl: `${process.env.FRONT_END_URL_ADMIN}/admin/customers/all/?customerId=${parseData?._id}`,
      footer: AuctropinConstants.email.footer,
      unsubscribe_link:
        process.env.UNSUBSCRIBE_REDIRECT_LINK_AUCTROPIN +
        "/" +
        Encrypted(parseData?._id || parseData?.email),
    };

    const options = {
      from: process.env.MAIL_FROM_ADDRESS,
      to: process.env.ADMIN_EMAIL,
      subject: "[AUCTROPIN] - New User Account Pending Approval",
      template: "account_under_review_pending_approval_by_admin",
      context: {
        data: data,
      },
    };

    const result = await sendMailAsync(options);
    console.log("Auctropin admin notification email sent:", result);
    return true;
  } catch (error) {
    console.log(
      "An exception occurred while sending Auctropin admin email:",
      error
    );
    return false;
  }
}
