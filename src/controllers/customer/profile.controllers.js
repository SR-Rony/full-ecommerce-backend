import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import _ from "lodash";
import mongoose from "mongoose";
import { customerControllerMessages } from "../../common/index.js";
import { redisClient } from "../../config/db.js";
import CONFIG from "../../config/index.js";
import {
  sendAuctropinAccountApprovedMail,
  sendAuctropinAccountUnderReviewMail,
  sendAuctropinCustomerPendingAccountApprovalMailByAdmin
} from "../../mail/auctropinEmailHelpers.js";
import { AuctropinCustomerMailController } from "../../mail/auctropinIndex.js";
import { Constants } from "../../mail/constants.js";
import {
  sendAccountApprovedMail,
  sendAccountUnderReviewMail,
  sendCustomerPendingAccountApprovalMailByAdmin,
  sendRefundRequestNotification
} from "../../mail/emailHelpers.js";
import { CustomerMailController } from "../../mail/index.js";
import CustomerModel from "../../models/Customer.model.js";
import CustomerShippingAddressModel from "../../models/CustomerShippingAddress.model.js";
import AppInfoSettingModel from "../../models/Setting/AppInfoSetting.model.js";
import { generateUniqueCode, verifyOTP } from "../../utils/helpers.js";
import { isValidEmail, isValidObjectId, responseError, responseSuccess } from "../../utils/index.js";
import { phoneAndCodeValidator } from "../../utils/phone.validator.js";
import CreditHistory from "../../models/CreditHistory.model.js";
export const profileUpdate = async (req, res, next) => {
  try {
    req.body["site"] = req?.body?.site || "hb";
    let body = req.body;

    if (body.hasOwnProperty("email")) {
      const emailExist = await CustomerModel.findOne({
        email: body?.email,
        site: body?.site,
      });
      if (emailExist)
        return res
          .status(400)
          .json(responseError("Email already exist! use deferent email"));

      const code = await generateUniqueCode({
        email: body?.email,
        _id: req?.customer?._id,
      }).catch((err) => {
        console.log(err);
        return res
          .status(400)
          .json(
            responseError(
              customerControllerMessages.profile.profileUpdateEmailLinkSend
                .codeGenError
            )
          );
      });

      const send =
        body?.site == "auctropin"
          ? await AuctropinCustomerMailController.auth.OtpMailSender({
            email: body?.email,
            code,
          })
          : await CustomerMailController.auth.OtpMailSender({
            email: body?.email,
            code,
          });
      if (send) {
      } else {
        await redisClient.del(`${code}`);
      }
    }
    body = _.omit(body, [
      "pass",
      "password",
      "email",
      "phone",
      "isEmailVerified",
      "address",
      "site",
    ]);
    const updatedData = {
      ...body,
      lastActivityAt: new Date(),
      lastAccountUpdatedBy: "self",
      lastAccountUpdatedByAdmin: null,
    };

    const data = await CustomerModel.findOneAndUpdate(
      { _id: req?.customer?._id },
      updatedData,
      { new: true }
    )
      .select("-pass")
      .lean();
    if (!data?._id)
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.profile.profileUpdate.errorMsg
          )
        );

    const token = jwt.sign(
      {
        _id: data?._id,
        email: data?.email,
        phone: data.phone || "",
        firstName: data?.firstName,
        lastName: data?.lastName,
        isEmailVerified: data?.isEmailVerified,
        isBlocked: data?.isBlocked || false,
        activity: data?.activity,
        avatar: data?.avatar,
        site: data?.site,
        isEmailInvalid: data?.isEmailInvalid,
        emailInvalidReason: data?.emailInvalidReason,
      },
      CONFIG.JWT.JWT_SECRET
    );
    data["token"] = token;
    await redisClient.set(
      `customer_auth_token_${data?._id?.toString()}`,
      token
    );
    return res
      .status(200)
      .json(
        responseSuccess(
          customerControllerMessages.profile.profileUpdate.successMsg,
          data
        )
      );
  } catch (error) {
    console.log(error);
    next(error);
  }
};
export const getMyProfile = async (req, res, next) => {
  try {
    const { site = "hb" } = req.query;
    const data = await CustomerModel.findOne({
      _id: req?.customer?._id,
      site: site,
    })
      .select("-pass")
      .lean();
    if (!data?._id)
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.profile.getMyProfile.errorMsg
          )
        );
    return res
      .status(200)
      .json(
        responseSuccess(
          customerControllerMessages.profile.getMyProfile.successMsg,
          data
        )
      );
  } catch (error) {
    next(error);
  }
};

export const getCreditBalance = async (req, res, next) => {
  try {
    const { site = "hb" } = req.query;
    const data = await CustomerModel.findOne({
      _id: req?.customer?._id,
      site: site,
    });
    if (!data?._id)
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.profile.getMyProfile.errorMsg
          )
        );
    
    return res
      .status(200)
      .json(
        responseSuccess(
          customerControllerMessages.profile.getMyProfile.successMsg,
          {
            "customerId": data._id,
            "email": data.email,
            "redirectForPrimoIssue": data.hasPrimoIssue && !data.haveSeenPrimoPage,
            "availableCreditBalance": parseFloat(data?.availableCreditBalance||0).toFixed(2),
          }
        )
      );
  } catch (error) {
    next(error);
  }
};

export const seenPrimoPage = async (req,res,next)=> {
  try {
    const { site = "hb" } = req.query;
    const data = await CustomerModel.findOne({
      _id: req?.customer?._id,
      site: site,
    });
    if (!data?._id)
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.profile.getMyProfile.errorMsg
          )
        );
    data.haveSeenPrimoPage = true;
    await data.save();
    return res
      .status(200)
      .json(
        responseSuccess(
          "Success")
      );
  } catch (error) {
    next(error);
  }
}
export const getCustomerForRefund = async (req, res, next) => {
  try {
    let { token } = req.params;
    let { site = "hb", email } = req.query;
    let customerId = null;

    if (!token) {
      return res.status(400).json(responseError("Invalid request unauthorized"));
    }

    token = (token || "").trim();
    email = (email || "").toLowerCase().trim();

    // Determine whether token is actually a Mongo ObjectId (customerId)
    if (isValidObjectId(token)) {
      customerId = token;
    }

    let customer;
    if (customerId) {
      console.log("lookup by customerId",customerId)
      // Lookup by customerId + email
      customer = await CustomerModel.findOne({
        _id: customerId,
        email,
        site,
      }).lean();
      
      if(!customer?.hasPrimoIssue) {
        return res.status(400).json(responseError("Invalid URL"));
      }
    } else {
      console.log("lookup by refund token",token)
      // Lookup by refund token
      customer = await CustomerModel.findOne({
        "creditBalanceRefund.refund_request_url_token": token,
        "creditBalanceRefund.token_invalid_at": null,
        site,
      }).lean();
    }

    console.log("customer", customer);

    if (!customer) {
      return res.status(404).json(responseError("Customer not found"));
    }

    if (!customer?.allow_refund_request) {
      return res
        .status(403)
        .json(responseError("You are not allowed to request a refund at this time"));
    }
    

    console.log(customer?.hasPrimoIssue,"customer.hasPrimoIssue")
    if (!customer?.hasPrimoIssue) {
      if (!customer?.creditBalanceRefund?.refund_request_url_token) {
        return res.status(404).json(responseError("Invalid request token"));
      }
      if (customer?.creditBalanceRefund?.token_invalid_at) {
        return res.status(404).json(responseError("Invalid request token"));
      }
    }

    if (customer?.creditBalanceRefund?.refundCompletedAt) {
      return res.status(409).json(responseError("Refund already completed"));
    }

    if (customer?.creditBalanceRefund?.refundRequestedAt) {
      return res.status(409).json(responseError("Refund already requested"));
    }

    const creditUseAlready = await CreditHistory.findOne({
      customerId: customer?._id,
      type: "debit",
    }).lean();

    if (creditUseAlready) {
      return res
        .status(400)
        .json(
          responseError(
            "You can't request refund as you already used credit balance."
          )
        );
    }

    return res.status(200).json(
      responseSuccess("Customer found", {
        id: customer._id,
        name: `${customer.firstName || "Customer"} ${
          customer.lastName || ""
        }`.trim(),
        email: customer.email,
        availableCreditBalance: parseFloat(
          customer.availableCreditBalance || 0
        ).toFixed(2),
      })
    );
  } catch (error) {
    console.error("Error in getCustomerForRefund:", error);
    return next(error?.message || "Failed to fetch customer information");
  }
};

export const requestCreditRefund = async (req, res, next) => {
  try {
    let { btcAddress, email, token } = req.body;
    let { site = "hb" } = req.query;
    let customerId = null;

    if (!btcAddress) {
      return res
        .status(400)
        .json(responseError("Please provide a valid BTC address"));
    }

    if (!token) {
      return res.status(400).json(responseError("Invalid request unauthorized"));
    }

    if (!email) {
      return res.status(400).json(responseError("Invalid email"));
    }

    token = (token || "").trim();
    email = (email || "").toLowerCase().trim();

    if (isValidObjectId(token)) {
      customerId = token;
    }

    let customer;
    if (customerId) {
      customer = await CustomerModel.findOne({
        _id: customerId,
        email,
        site,
      }).lean();
    } else {
      customer = await CustomerModel.findOne({
        "creditBalanceRefund.refund_request_url_token": token,
        "creditBalanceRefund.token_invalid_at": null,
        site,
      }).lean();
    }

    if (!customer) {
      return res.status(404).json(responseError("Invalid request unauthorized"));
    }
    console.log(customer?.hasPrimoIssue,"customer?.hasPrimoIssue")
    if (!customer?.allow_refund_request) {
      return res
        .status(403)
        .json(responseError("You are not allowed to request a refund at this time"));
    }

    if (!customer?.hasPrimoIssue) {
      if (!customer?.creditBalanceRefund?.refund_request_url_token) {
        return res.status(404).json(responseError("Invalid request token"));
      }
      if (customer?.creditBalanceRefund?.token_invalid_at) {
        return res.status(404).json(responseError("Invalid request token"));
      }
    }

    const availableCredit = parseFloat(customer?.availableCreditBalance || 0);
    if (availableCredit <= 0) {
      return res
        .status(400)
        .json(responseError("Insufficient credit balance for refund"));
    }

    if (customer?.email.trim()?.toLowerCase() !== email) {
      return res.status(400).json(responseError("Invalid email provided"));
    }

    const creditUseAlready = await CreditHistory.findOne({
      customerId: customer?._id,
      type: "debit",
    }).lean();

    if (creditUseAlready) {
      console.log("creditUseAlready", creditUseAlready);
      return res
        .status(400)
        .json(
          responseError(
            "You can't request refund as you already used credit balance."
          )
        );
    }

    if (customer?.creditBalanceRefund?.refundCompletedAt) {
      return res.status(409).json(responseError("Refund already completed"));
    }

    if (customer?.creditBalanceRefund?.refundRequestedAt) {
      return res
        .status(409)
        .json(responseError("Refund request already submitted"));
    }

    const creditBalanceRefund = {
      ...customer?.creditBalanceRefund,
      refundRequestedAt: new Date(),
      refundCompletedAt: null,
      refundAmount: availableCredit,
      refundInformation: {
        email: customer?.email,
        btcAddress,
        amount: availableCredit,
      },
      lastUpdated: new Date(),
    };

    await CustomerModel.updateOne(
      { _id: customer?._id },
      { availableCreditBalance: 0, creditBalanceRefund },
      { new: true }
    );

    try {
      await sendRefundRequestNotification(customer, btcAddress, availableCredit);
    } catch (emailError) {
      console.error("Failed to send refund request notification:", emailError);
    }

    return res.status(200).json(
      responseSuccess("Refund request submitted successfully", {
        refundRequestedAt: new Date(),
        refundCompletedAt: null,
        creditBalance: availableCredit,
      })
    );
  } catch (error) {
    console.error("Error in requestCreditRefund:", error);
    return next(error?.message || "Failed to process refund request");
  }
};
export const profileForgotPasswordLinkSend = async (req, res, next) => {
  try {
    const site = req.body?.site || req.body?.query || "hb";
    const data = await CustomerModel.findOne({
      email: req?.body?.email,
      site: site,
    })
      .select("-pass")
      .lean();
    if (!data?._id)
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.profile.profileForgotPasswordLinkSend
              .existError
          )
        );

    if (data?.isEmailInvalid == true) {
      return res.status(400).json({
        success: false,
        code: 400,
        redirectTo: Constants.redirectTo,
        emailInvalidReason: data?.emailInvalidReason,
        email: data?.email,
        customerId: data?._id,
        message:
          "Your current email is invalid/not reachable, please update your email to your one of operational email in order to use H&B and get updates.",
      });
    }
    generateUniqueCode({ email: data?.email, _id: data?._id })
      .then(async (code) => {
        const send =
          site === "auctropin"
            ? await AuctropinCustomerMailController.auth.PasswordResetMailSender(
              {
                email: data?.email,
                code,
                origin: req.origin,
              }
            )
            : await CustomerMailController.auth.PasswordResetMailSender({
              email: data?.email,
              code,
              origin: req.origin,
            });
        if (send) {
          return res
            .status(200)
            .json(
              responseSuccess(
                customerControllerMessages.profile.profileForgotPasswordLinkSend
                  .successMsg
              )
            );
        } else {
          await redisClient.del(`${code}`);
          return res
            .status(400)
            .json(
              responseError(
                customerControllerMessages.profile.profileForgotPasswordLinkSend
                  .errorMsg
              )
            );
        }
      })
      .catch((err) => {
        return res
          .status(400)
          .json(
            responseError(
              customerControllerMessages.profile.profileForgotPasswordLinkSend
                .codeGenError
            )
          );
      });
  } catch (error) {
    next(error);
  }
};

export const profileResetPasswordLinkVerify = async (req, res, next) => {
  try {
    const { password, email, site = "hb", password2, code } = req.body;

    // console.log(password,email)
    if (password !== password2)
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.profile.profileResetPasswordLinkVerify
              .passwordError
          )
        );

    const data = await verifyOTP(code, email);
    if (!data) {
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.profile.profileResetPasswordLinkVerify
              .expiredError
          )
        );
    } else {
      const customer = await CustomerModel.findOne({
        email: data?.email,
        site: site,
      }).lean();
      if (!customer?._id) {
        return res
          .status(400)
          .json(
            responseError(
              customerControllerMessages.profile.profileResetPasswordLinkVerify
                .errorMsg
            )
          );
      }
      const pass = await bcrypt.hash(password, 10);
      const updatedData = {
        pass,
        isEmailInvalid: false,
        emailInvalidReason: "",
        lastActivityAt: new Date(),
        lastAccountUpdatedBy: "self",
        lastAccountUpdatedByAdmin: null,
        isApprovalPendingEmailAlreadySent:
          customer.isApprovalPendingEmailAlreadySent, // Preserve existing value if email wasn't sent
      };
      // Fetch latest app info
      const appInfo = await AppInfoSettingModel.findOne().sort("-updatedAt").lean();

      // Determine if admin approval is required
      const isAdminApprovalRequired = appInfo?.registration?.isRegistrationAdminApprovalRequired;
      const isEmailNotSentYet = customer.isApprovalPendingEmailAlreadySent === false;
      const isNotApprovedYet = !customer?.approved_by_admin_at;

      const customerEmailData = {
        ...customer,
        email: data.email,
        customerName: customer.firstName || "Customer",
      };

      if (isAdminApprovalRequired) {
        // If approval is required and email hasn’t been sent
        if (isEmailNotSentYet) {
          if (site === "auctropin") {
            const emailSent = await sendAuctropinAccountUnderReviewMail(customerEmailData);
            if (emailSent) {
              updatedData.isApprovalPendingEmailAlreadySent = true;
              sendAuctropinCustomerPendingAccountApprovalMailByAdmin(customerEmailData);
            }
          } else {
            const emailSent = await sendAccountUnderReviewMail(customerEmailData);
            if (emailSent) {
              updatedData.isApprovalPendingEmailAlreadySent = true;
              sendCustomerPendingAccountApprovalMailByAdmin(customerEmailData);
            }
          }
        }
      } else {
        if (isNotApprovedYet) {
          updatedData.approved_by_admin_at = new Date();
        }
        updatedData.isApprovalPendingEmailAlreadySent = true;
        updatedData.isEmailVerified = true;
        // If no approval required and customer is not approved yet
        if (isNotApprovedYet) {
          if (site === "auctropin") {
            await sendAuctropinAccountApprovedMail(customerEmailData);
          } else {
            await sendAccountApprovedMail(customerEmailData);
          }
        }
      }
      const updatedCustomer = await CustomerModel.findOneAndUpdate(
        { email: data?.email, site: site },
        updatedData,
        { new: true }
      ).lean();

      const token = jwt.sign(
        {
          _id: updatedCustomer?._id,
          email: updatedCustomer?.email,
          phone: updatedCustomer.phone || "",
          firstName: updatedCustomer?.firstName,
          lastName: updatedCustomer?.lastName,
          isEmailVerified: updatedCustomer?.isEmailVerified,
          isBlocked: updatedCustomer?.isBlocked || false,
          activity: updatedCustomer?.activity,
          avatar: updatedCustomer?.avatar,
          site: updatedCustomer?.site,
          isEmailInvalid: updatedCustomer?.isEmailInvalid,
          emailInvalidReason: updatedCustomer?.emailInvalidReason,
        },
        CONFIG.JWT.JWT_SECRET
      );

      await redisClient.set(
        `customer_auth_token_${updatedCustomer?._id}`,
        token
      );
      const customerShippingAddress =
        !updatedCustomer?.firstName &&
        (await CustomerShippingAddressModel.findOne({
          customer: updatedCustomer?._id,
        })?.lean());
      const name = `${updatedCustomer?.firstName ||
        customerShippingAddress?.receiverName?.firstName ||
        ""
        } ${updatedCustomer?.lastName ||
        customerShippingAddress?.receiverName?.lastName ||
        ""
        }`;
      if (customer?.isEmailInvalid == true) {
        return res.status(400).json({
          success: false,
          code: 400,
          redirectTo: Constants.redirectTo,
          emailInvalidReason: customer?.emailInvalidReason,
          email: customer?.email,
          customerId: customer?._id,
          message:
            "Your current email is invalid/not reachable, please update your email to your one of operational email in order to use H&B and get updates.",
        });
      }

      site == "auctropin"
        ? await AuctropinCustomerMailController.auth.PasswordChangeMailSender({
          name,
          email: updatedCustomer?.email,
        })
        : await CustomerMailController.auth.PasswordChangeMailSender({
          name,
          email: updatedCustomer?.email,
        });

      return res.status(200).json(
        responseSuccess(
          customerControllerMessages.profile.profileResetPasswordLinkVerify
            .successMsg,
          {
            token,
            email: updatedCustomer?.email,
            isEmailVerified: updatedCustomer?.isEmailVerified,
          }
        )
      );
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const profileMatchedPasswordReset = async (req, res, next) => {
  try {
    const { oldPassword, site = "hb", password, password2 } = req.body;
    if (password !== password2)
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.profile.profileMatchedPasswordReset
              .passwordError
          )
        );
    // Find the customer by username
    let customer = await CustomerModel.findOne({
      _id: req?.customer?._id,
      site: site,
    }).lean();
    if (customer && (await bcrypt.compare(oldPassword, customer?.pass))) {
      const pass = await bcrypt.hash(password, 10);
      const updatedData = {
        pass,
        lastActivityAt: new Date(),
        lastAccountUpdatedBy: "self",
        lastAccountUpdatedByAdmin: null,
      };
      const updatedCustomer = await CustomerModel.findOneAndUpdate(
        { _id: customer?._id },
        updatedData,
        { new: true }
      ).lean();

      const token = jwt.sign(
        {
          _id: updatedCustomer?._id,
          email: updatedCustomer?.email,
          phone: updatedCustomer.phone || "",
          firstName: updatedCustomer?.firstName,
          lastName: updatedCustomer?.lastName,
          isEmailVerified: updatedCustomer?.isEmailVerified,
          isBlocked: updatedCustomer?.isBlocked || false,
          activity: updatedCustomer?.activity,
          avatar: updatedCustomer?.avatar,
          site: updatedCustomer?.site,
          isEmailInvalid: updatedCustomer?.isEmailInvalid,
          emailInvalidReason: updatedCustomer?.emailInvalidReason,
        },
        CONFIG.JWT.JWT_SECRET
      );

      await redisClient.set(
        `customer_auth_token_${updatedCustomer?._id}`,
        token
      );
      const customerShippingAddress =
        !updatedCustomer?.firstName &&
        (await CustomerShippingAddressModel.findOne({
          customer: updatedCustomer?._id,
        })?.lean());
      const name = `${updatedCustomer?.firstName ||
        customerShippingAddress?.receiverName?.firstName ||
        ""
        } ${updatedCustomer?.lastName ||
        customerShippingAddress?.receiverName?.lastName ||
        ""
        }`;

      site == "auctropin"
        ? await AuctropinCustomerMailController.auth.PasswordChangeMailSender({
          name,
          email: updatedCustomer?.email,
        })
        : await CustomerMailController.auth.PasswordChangeMailSender({
          name,
          email: updatedCustomer?.email,
        });

      return res.status(200).json(
        responseSuccess(
          customerControllerMessages.profile.profileMatchedPasswordReset
            .successMsg,
          {
            token,
            email: updatedCustomer?.email,
            isEmailVerified: updatedCustomer?.isEmailVerified,
          }
        )
      );
    } else {
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.profile.profileMatchedPasswordReset
              .oldPasswordError,
            [],
            400
          )
        );
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const profileUpdateEmailLinkSend = async (req, res, next) => {
  try {
    const { site = "hb" } = req.body;
    const data = await CustomerModel.findOne({
      email: req?.body?.email,
      site: site,
    }).select("-pass");

    if (!data?._id)
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.profile.profileUpdateEmailLinkSend
              .existError
          )
        );

    const updateEmailExist = await CustomerModel.findOne({
      email: req?.body?.updateEmail,
      site: site,
    });
    if (updateEmailExist) {
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.profile.profileUpdateEmailLinkSend
              .updateEmailExistError
          )
        );
    }

    generateUniqueCode({ email: req?.body?.updateEmail, _id: data?._id })
      .then(async (code) => {
        const send =
          site == "auctropin"
            ? await AuctropinCustomerMailController.auth.OtpMailSender({
              email: req?.body?.updateEmail,
              code,
            })
            : await CustomerMailController.auth.OtpMailSender({
              email: req?.body?.updateEmail,
              code,
            });
        if (send) {
          return res
            .status(200)
            .json(
              responseSuccess(
                customerControllerMessages.profile.profileUpdateEmailLinkSend
                  .successMsg
              )
            );
        } else {
          await redisClient.del(`${code}`);
          return res
            .status(400)
            .json(
              responseError(
                customerControllerMessages.profile.profileUpdateEmailLinkSend
                  .errorMsg
              )
            );
        }
      })
      .catch((err) => {
        return res
          .status(400)
          .json(
            responseError(
              customerControllerMessages.profile.profileUpdateEmailLinkSend
                .codeGenError
            )
          );
      });
  } catch (error) {
    next(error);
  }
};

export const profileResendEmailOtpLinkSend = async (req, res, next) => {
  try {
    const { site = "hb" } = req.body;
    const data = await CustomerModel.findOne({
      email: req?.body?.email,
      site: site,
    })
      .select("-pass")
      .lean();
    if (!data?._id)
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.profile.profileUpdateEmailLinkSend
              .existError
          )
        );

    generateUniqueCode({ email: data?.email, _id: data?._id })
      .then(async (code) => {
        const send =
          site == "auctropin"
            ? await AuctropinCustomerMailController.auth.OtpMailSender({
              email: data?.email,
              code,
              origin: req.origin,
            })
            : await CustomerMailController.auth.OtpMailSender({
              email: data?.email,
              code,
              origin: req.origin,
            });
        if (send) {
          return res
            .status(200)
            .json(
              responseSuccess(
                customerControllerMessages.profile.profileUpdateEmailLinkSend
                  .successMsg
              )
            );
        } else {
          await redisClient.del(`${code}`);
          return res
            .status(400)
            .json(
              responseError(
                customerControllerMessages.profile.profileUpdateEmailLinkSend
                  .errorMsg
              )
            );
        }
      })
      .catch((err) => {
        return res
          .status(400)
          .json(
            responseError(
              customerControllerMessages.profile.profileUpdateEmailLinkSend
                .codeGenError
            )
          );
      });
  } catch (error) {
    next(error);
  }
};

export const profileEmailLinkVerify = async (req, res, next) => {
  try {
    const { code, email, site = "hb" } = req.body;

    const data = await verifyOTP(code, email);
    if (!data) {
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.profile.profileEmailLinkVerify
              .expiredError
          )
        );
    } else {
      const id = new mongoose.Types.ObjectId(data?._id);
      const customer = await CustomerModel.findOne({
        _id: id,
        site: site,
      }).lean();
      if (!customer?._id) {
        return res
          .status(400)
          .json(
            responseError(
              customerControllerMessages.profile.profileEmailLinkVerify
                .existError
            )
          );
      }

      const updatedData = {
        email: data?.email,
        isEmailInvalid: false,
        emailInvalidReason: "",
        isEmailVerified: true,
        lastActivityAt: new Date(),
        lastAccountUpdatedBy: "self",
        lastAccountUpdatedByAdmin: null,
        isApprovalPendingEmailAlreadySent:
          customer.isApprovalPendingEmailAlreadySent, // Preserve existing value if email wasn't sent
      };
      // Fetch latest app info
      const appInfo = await AppInfoSettingModel.findOne().sort("-updatedAt").lean();

      // Determine if admin approval is required
      const isAdminApprovalRequired = appInfo?.registration?.isRegistrationAdminApprovalRequired;
      const isEmailNotSentYet = customer.isApprovalPendingEmailAlreadySent === false;
      const isNotApprovedYet = !customer?.approved_by_admin_at;

      const customerEmailData = {
        ...customer,
        email: data.email,
        customerName: customer.firstName || "Customer",
      };


      if (isAdminApprovalRequired) {
        // If approval is required and email hasn’t been sent
        if (isEmailNotSentYet) {
          if (site === "auctropin") {
            const emailSent = await sendAuctropinAccountUnderReviewMail(customerEmailData);
            if (emailSent) {
              updatedData.isApprovalPendingEmailAlreadySent = true;
              sendAuctropinCustomerPendingAccountApprovalMailByAdmin(customerEmailData);
            }
          } else {
            const emailSent = await sendAccountUnderReviewMail(customerEmailData);
            if (emailSent) {
              updatedData.isApprovalPendingEmailAlreadySent = true;
              sendCustomerPendingAccountApprovalMailByAdmin(customerEmailData);
            }
          }
        }
      } else {
        if (isNotApprovedYet) {
          updatedData.approved_by_admin_at = new Date();
        }

        updatedData.isApprovalPendingEmailAlreadySent = true;
        updatedData.isEmailVerified = true;
        // If no approval required and customer is not approved yet
        if (isNotApprovedYet) {
          if (site === "auctropin") {
            await sendAuctropinAccountApprovedMail(customerEmailData);
          } else {
            await sendAccountApprovedMail(customerEmailData);
          }
        }
      }
      const updatedCustomer = await CustomerModel.findOneAndUpdate(
        { _id: id, site: site },
        updatedData,
        { new: true }
      ).lean();

      const token = jwt.sign(
        {
          _id: updatedCustomer?._id,
          email: updatedCustomer?.email,
          phone: updatedCustomer.phone || "",
          firstName: updatedCustomer?.firstName,
          lastName: updatedCustomer?.lastName,
          isEmailVerified: updatedCustomer?.isEmailVerified,
          isBlocked: updatedCustomer?.isBlocked || false,
          activity: updatedCustomer?.activity,
          avatar: updatedCustomer?.avatar,
          site: updatedCustomer?.site,
          isEmailInvalid: updatedCustomer?.isEmailInvalid,
          emailInvalidReason: updatedCustomer?.emailInvalidReason,
        },
        CONFIG.JWT.JWT_SECRET
      );

      await redisClient.set(
        `customer_auth_token_${updatedCustomer?._id}`,
        token
      );

      return res.status(200).json(
        responseSuccess(
          //!updatedCustomer?.approved_by_admin_at ? "Your account is currently under review by our admin team. Once approved, you will receive an email notification and will be able to log in and purchase products on our website. The review process may take up to 24 hours. Thank you for your patience!" : customerControllerMessages.profile.profileEmailLinkVerify.successMsg,
          "OTP has been verified.",
          {
            token: updatedCustomer?.approved_by_admin_at ? token : null,
            email: updatedCustomer?.email,
            isEmailVerified: updatedCustomer?.isEmailVerified,
          }
        )
      );
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const profileUpdatePhoneNumber = async (req, res, next) => {
  try {
    let body = req.body;
    let site = req.body?.site || "hb";

    if (!body?.phone?.number)
      return res.status(400).json(responseError("Phone number is required!"));
    const phoneValid = await phoneAndCodeValidator(
      body?.phone?.number,
      body?.phone?.country
    );
    if (typeof phoneValid == "string") {
      return res.status(400).json(responseError(phoneValid, 400));
    }

    const phoneNumExist = await CustomerModel.findOne({
      "phone.nationalNumber": phoneValid?.nationalNumber.toString(),
      site: site,
    }).lean();
    if (phoneNumExist) {
      return res.status(400).json(responseError("Phone number already exist!"));
    }
    req.body["phone"] = phoneValid;
    const updatedData = {
      phone: body?.phone,
      lastActivityAt: new Date(),
      lastAccountUpdatedBy: "self",
      lastAccountUpdatedByAdmin: null,
    };
    // console.log(req.customer)

    const data = await CustomerModel.findOneAndUpdate(
      { _id: req?.customer?._id, site: site },
      updatedData,
      { new: true }
    )
      .select("-pass")
      .lean();

    if (!data?._id)
      return res
        .status(400)
        .json(responseError("Failed to update phone number!"));

    const token = jwt.sign(
      {
        _id: data?._id,
        email: data?.email,
        phone: data.phone || "",
        firstName: data?.firstName,
        lastName: data?.lastName,
        isEmailVerified: data?.isEmailVerified,
        isBlocked: data?.isBlocked || false,
        activity: data?.activity,
        avatar: data?.avatar,
        site: data?.site,
        isEmailInvalid: data?.isEmailInvalid,
        emailInvalidReason: data?.emailInvalidReason,
      },
      CONFIG.JWT.JWT_SECRET
    );
    data["token"] = token;
    await redisClient.set(
      `customer_auth_token_${data?._id?.toString()}`,
      token
    );
    return res
      .status(200)
      .json(responseSuccess("Phone number updated successfully!", data));
  } catch (error) {
    console.log(error);
    next(error);
  }
};
