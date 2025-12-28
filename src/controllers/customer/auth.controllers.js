import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { customerControllerMessages } from "../../common/index.js";
import { redisClient } from "../../config/db.js";
import CONFIG from "../../config/index.js";
import {
  sendAuctropinAccountApprovedMail,
  sendAuctropinAccountUnderReviewMail,
  sendAuctropinCustomerPendingAccountApprovalMailByAdmin,
} from "../../mail/auctropinEmailHelpers.js";
import { AuctropinCustomerMailController } from "../../mail/auctropinIndex.js";
import { Constants } from "../../mail/constants.js";
import {
  sendAccountApprovedMail,
  sendAccountUnderReviewMail,
  sendCustomerPendingAccountApprovalMailByAdmin,
} from "../../mail/emailHelpers.js";
import { CustomerMailController } from "../../mail/index.js";
import CustomerModel from "../../models/Customer.model.js";
import AppInfoSettingModel from "../../models/Setting/AppInfoSetting.model.js";
import { generateUniqueCode } from "../../utils/helpers.js";
import { responseError, responseSuccess } from "../../utils/index.js";
import { phoneAndCodeValidator } from "../../utils/phone.validator.js";

export const customerSignup = async (req, res, next) => {
  try {
    req.body["site"] = req?.body?.site || "hb";

    const { email, site = "hb", password, phone } = req.body;
    if (req?.body?.site == "auctropin") {
      req.body["isTestCustomer"] = true;
    }
    const exist = await CustomerModel.findOne({
      email: email,
      site: site,
    }).lean();
    if (exist?._id)
      return res
        .status(400)
        .json(
          responseError(customerControllerMessages.auth.customerSignup.errorMsg)
        );
    const phoneNum = phone?.number;
    const country = phone?.country;
    if (phoneNum) {
      const phoneValid = await phoneAndCodeValidator(phoneNum, country);
      if (typeof phoneValid == "string") {
        return res.status(400).json(responseError(phoneValid, 400));
      }
      const phoneNumExist = await CustomerModel.findOne({
        "phone.nationalNumber": phoneValid?.nationalNumber.toString(),
        site: site,
      }).lean();
      if (phoneNumExist) {
        return res
          .status(400)
          .json(responseError("Phone number already exist!"));
      }
      req.body["phone"] = phoneValid;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    req.body["pass"] = hashedPassword;
    if (req?.body.hasOwnProperty("isEmailVerified")) {
      delete req.body.isEmailVerified;
    }

    req.body.origin = req.origin;

    delete req.body._id;
    // Create a new customer
    req.body["isEmailVerified"] = false; // Set email verification status to false
    req.body["isApprovalPendingEmailAlreadySent"] = false; // Set approval pending email
    req.body["isEmailInvalid"] = false; // Set email invalid status to false
    req.body["emailInvalidReason"] = null; // Set email invalid reason to null
    req.body["approved_by_admin_at"] = null; // Set approval by admin date to null
    req.body["isBlocked"] = false; // Set blocked status to false
    req.body["activity"] = {
      lastLoginAt: new Date(),
      lastActivityAt: new Date(),
      lastAccountUpdatedBy: "self", // or 'admin' or other logic
    };
    const newCustomer = new CustomerModel(req.body);

    // Save the new customer to the database
    await newCustomer.save();

    // added new end proper
    if (newCustomer?.isEmailVerified === false) {
      if (newCustomer?.isEmailInvalid === true) {
        return res.status(400).json({
          success: false,
          code: 400,
          redirectTo: Constants.redirectTo,
          emailInvalidReason: newCustomer?.emailInvalidReason,
          email: newCustomer?.email,
          customerId: newCustomer?._id,
          message:
            "Your current email is invalid/not reachable, please update your email to your one of operational email in order to use H&B and get updates.",
        });
      }
      let code;
      try {
        code = await generateUniqueCode({
          email: newCustomer?.email,
          _id: newCustomer?._id,
        });
      } catch (err) {
        console.log(err);
        return res
          .status(400)
          .json(
            responseError(
              customerControllerMessages.profile.profileUpdateEmailLinkSend
                .codeGenError
            )
          );
      }

      try {
        const send =
          site == "auctropin"
            ? await AuctropinCustomerMailController.auth.OtpMailSender({
              email: newCustomer?.email,
              code,
            })
            : await CustomerMailController.auth.OtpMailSender({
              email: newCustomer?.email,
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
          await newCustomer.deleteOne();
          return res
            .status(400)
            .json(
              responseError(
                customerControllerMessages.profile.profileUpdateEmailLinkSend
                  .onRegisterEmailError
              )
            );
        }
      } catch (error) {
        console.error(error);
        return next(error);
      }
    }
    // If email is already verified, return success
    return res.status(200).json(responseSuccess("Registration successful."));
  } catch (error) {
    console.error(error);
    return next(error);
  }
};

export const customerLogin = async (req, res, next) => {
  try {
    req.body["site"] = req?.body?.site || "hb";
    const { email, site = "hb", password } = req.body;

    // Find the customer by username
    let customer = await CustomerModel.findOne({ email, site }).lean();

    if (!customer) {
      return res
        .status(400)
        .json(
          responseError(
            customerControllerMessages.auth.customerLogin.errorMsg,
            [],
            400
          )
        );
    }
    if (customer?.isBlocked === true) {
      return res
        .status(401)
        .json(
          responseError(
            customerControllerMessages.auth.customerLogin.blockedMsg,
            [],
            401
          )
        );
    }

    if (customer.isEmailVerified === false) {
      const code = await generateUniqueCode({
        email: customer.email,
        _id: customer._id,
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
      const send =
        site == "auctropin"
          ? await AuctropinCustomerMailController.auth.OtpMailSender({
            email: customer.email,
            code,
          })
          : await CustomerMailController.auth.OtpMailSender({
            email: customer.email,
            code,
          });

      if (send) {
        return res
          .status(200)
          .json(
            responseSuccess(
              customerControllerMessages.profile.profileUpdateEmailLinkSend
                .successMsg,
              { isEmailVerified: customer?.isEmailVerified }
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
    }

    // Check password
    if (await bcrypt.compare(password, customer.pass)) {
      if (customer?.approved_by_admin_at === null) {
        // Send approval under review email if not sent before
        if (customer.isApprovalPendingEmailAlreadySent === false) {
          // Fetch latest app info
          const appInfo = await AppInfoSettingModel.findOne().sort("-updatedAt").lean();

          // Determine if admin approval is required
          const isAdminApprovalRequired = appInfo?.registration?.isRegistrationAdminApprovalRequired;
          const isEmailNotSentYet = customer.isApprovalPendingEmailAlreadySent === false;
          const isNotApprovedYet = !customer?.approved_by_admin_at;

          const customerEmailData = {
            ...customer,
            email: customer.email,
            customerName: customer.firstName || "Customer",
          };

          if (isAdminApprovalRequired) {
            // If approval is required and email hasn’t been sent
            if (isEmailNotSentYet) {
              if (site === "auctropin") {
                const emailSent = await sendAuctropinAccountUnderReviewMail(customerEmailData);
                if (emailSent) {
                  await CustomerModel.findOneAndUpdate(
                    { _id: customer._id },
                    {
                      isApprovalPendingEmailAlreadySent: true,
                    },
                    { new: true }
                  );
                  await sendAuctropinCustomerPendingAccountApprovalMailByAdmin(customerEmailData);

                }
              } else {
                const emailSent = await sendAccountUnderReviewMail(customerEmailData);
                if (emailSent) {
                  await CustomerModel.findOneAndUpdate(
                    { _id: customer._id },
                    {
                      isApprovalPendingEmailAlreadySent: true,
                    },
                    { new: true }
                  );
                  await sendCustomerPendingAccountApprovalMailByAdmin(customerEmailData);
                }
              }
            }
          } else {
            // If no approval required and email hasn’t been sent
            if (isNotApprovedYet) {
              customer.isApprovalPendingEmailAlreadySent = true; // Mark email as sent
              await CustomerModel.findOneAndUpdate(
                { _id: customer._id },
                {
                  isApprovalPendingEmailAlreadySent: true,
                  approved_by_admin_at: new Date(),

                },
                { new: true }
              );

                if (site === "auctropin") {
                  await sendAuctropinAccountApprovedMail(customerEmailData);
                } else {
                  await sendAccountApprovedMail(customerEmailData);
                }
            }
          }
        }

        return res
          .status(400)
          .json(
            responseError(
              "Your account is currently under review by our admin team. Once approved, you will receive an email notification and will be able to log in and purchase products on our website. The review process may take up to 24 hours. Thank you for your patience!",
              [],
              400
            )
          );
      }

      // Update activity object
      const today = new Date().toDateString();

      // Update lastLoginAt only if it hasn't been updated today
      const lastLoginDate = customer.activity?.lastLoginAt?.toDateString();
      const activity = {
        ...(customer.activity || {}),
        lastLoginAt: new Date(),
        lastActivityAt: new Date(),
      };
      customer.activity = activity;
      if (!lastLoginDate || lastLoginDate !== today) {
        //You may want to update lastAccountUpdatedBy based on your logic
        activity["lastAccountUpdatedBy"] = "self"; // or 'admin' or other logic
        activity["lastAccountUpdatedByAdmin"] = null;
        // Save the updated customer in MongoDB
        await CustomerModel.findOneAndUpdate(
          { _id: customer?._id },
          { activity: activity },
          { new: true }
        );
      }
      // Generate Bearer token upon successful login
      const tokenPayload = {
        _id: customer._id.toString(),
        email: customer.email,
        phone: customer.phone || "",
        firstName: customer.firstName,
        lastName: customer.lastName,
        avatar: customer?.avatar,
        isEmailVerified: customer.isEmailVerified,
        isBlocked: customer.isBlocked || false,
        isEmailInvalid: customer?.isEmailInvalid,
        emailInvalidReason: customer?.emailInvalidReason,
        activity: activity, // Include the entire activity object
        // Add more data as needed
      };

      const token = jwt.sign(tokenPayload, CONFIG.JWT.JWT_SECRET);
      customer.token = token;

      // Update Redis with the new token
      redisClient.set(`customer_auth_token_${customer._id.toString()}`, token);

      // Remove sensitive information from the response
      delete customer.pass;

      return res
        .status(200)
        .json(
          responseSuccess(
            customerControllerMessages.auth.customerLogin.successMsg,
            customer
          )
        );
    } else {
      return res
        .status(401)
        .json(
          responseError(
            customerControllerMessages.auth.customerLogin.errorMsg,
            [],
            401
          )
        );
    }
  } catch (error) {
    console.error(error);
    return next(error);
  }
};

export const customerLogOut = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const data = await redisClient.del(`customer_auth_token_${userId}`);

    return res
      .status(200)
      .json(responseSuccess("Logout successfully!", { userId }));
  } catch (error) {
    next(error);
  }
};
