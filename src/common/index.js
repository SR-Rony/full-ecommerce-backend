export const customerControllerMessages = {
  auth: {
    customerSignup: {
      successMsg: 'Customer Registration successfully!',
      errorMsg: 'Customer already exist!'
    },
    customerLogin: {
      successMsg: 'Customer login successfully!',
      errorMsg: 'Customer email or password invalid!',
      blockedMsg: 'Error logging in'
    }
  },
  category: {
    categorySingleDetails: {
      successMsg: 'Category details found!',
      errorMsg: 'Category details not found'
    },
    getPublicCategories: {
      successMsg: 'Categories get successfully!',
      errorMsg: ''
    }
  },
  product: {
    productSingleDetails: {
      successMsg: 'Product details found!',
      errorMsg: 'Product details not found'
    },
    getPublicProducts: {

      successMsg: 'Products get successfully!',
      errorMsg: '',
      startDateInvalid: 'Start Date query invalid!',
      endDateInvalid: 'End Date query invalid!',
      categoryIdError: 'Invalid categoryId!'
    }
  },
  modalPopup: {
    modalPopupSingleDetails: {
      successMsg: 'Modal popup details found!',
      errorMsg: 'Modal popup details not found!'
    },
    getPublicModalPopups: {
      successMsg: 'Modal popup  get successfully!',
      errorMsg: ''
    }
  },
  appInfoSetting: {
    appInfoSettingSingleLatestDetails: {
      successMsg: 'shipping setting details found!',
      errorMsg: 'shipping setting details not found!'
    }
  },
  shippingOptionSetting: {
    shippingSettingSingleLatestOneDetails: {
      successMsg: 'shipping setting details found!',
      errorMsg: 'shipping setting details not found!'
    }
  },

  contactCategory: {
    contactCategorySingleDetails: {
      successMsg: 'contact category  details found!',
      errorMsg: 'contact category details not found!'
    },
    getPublicContactCategories: {
      successMsg: 'contact categories get successfully!',
      errorMsg: ''
    }
  },
  contact: {
    contactCreate: {
      successMsg: 'Message sent successfully!',
      errorMsg: 'Email send failed!',
      contactCategoryError: 'contact category not found! refresh the page!',
    },
    getCustomerContacts: {
      successMsg: 'Customer contacts',
      contactCategoryIdError: 'Invalid contactCategoryId!',
      customerIdError: 'Invalid customerId!',
      errorObjectIdMsg: 'Invalid query contactCategoryId',
      errorMsg: 'Customer contacts not found 404!'
    }
  },
  faq: {
    faqSingleDetails: {
      successMsg: 'Faq details found!',
      errorMsg: 'Faq details not found!'
    },
    getPublicFaqs: {
      successMsg: 'Faqs get successfully!',
      errorMsg: ''
    }
  },
  customerShippingAddress: {
    customerShippingAddressCreateAndUpdate: {
      successMsg: 'Address update successfully!',
      errorMsg: 'Address update failed!'
    },
    customerShippingAddressGetDetails: {
      successMsg: 'Address get successfully!',
      errorMsg: 'Address not found! you can update your address!'
    },
    customerShippingAddressSearch: {
      emailError: 'Email invalid!',
      errorMsg: 'Address not found! you can update your address!'
    }
  },
  profile: {
    profileUpdate: {
      successMsg: 'Profile update successfully!',
      errorMsg: 'Profile update failed!',
      existError: 'Customer not found!'
    },
    getMyProfile: {
      successMsg: 'Profile get successfully!',
      errorMsg: 'Profile get failed!',
      existError: 'Customer not found!'
    },
    profileUpdateEmailLinkSend: {
      successMsg: 'Please verify your email! check inbox or spam',
      errorMsg: 'Email invalid!',
      emailError: 'Email invalid!',
      onRegisterEmailError: "Sending verification email has been failed, please try again!",
      codeError: 'code invalid!',
      codeGenError: 'code generate failed! try again!',
      existError: 'Customer not found!',
      updateEmailError: 'Update email invalid!',
      updateEmailExistError: 'Update email already exist!!'
    },
    profileResendEmailOtpLinkSend: {
      successMsg: 'Please verify your email! check inbox or spam',
      errorMsg: 'Sending verification email has been failed, please try again!',
      emailError: 'Email invalid!',
      codeError: 'code invalid!',
      codeGenError: 'code generate failed! try again!',
      existError: 'Customer not found!',
    },
    profileEmailLinkVerify: {
      successMsg: 'Email verified successfully!',
      errorMsg: 'Email verification failed!',
      codeError: 'code invalid!',
      codeGenError: 'code generate failed! try again!',
      existError: 'Customer not found!',
      expiredError: 'OTP code is invalid/expired.!'
    },

    profileForgotPasswordLinkSend: {
      successMsg:
        'Password  reset link generate successfully! check your inbox or spam',
      errorMsg: 'Sending verification email has been failed, please try again!',
      codeError: 'code invalid!',
       emailError: 'Email invalid!',
      existError: 'Customer not found!',
      codeGenError: 'code generate failed! try again!'
    },
    profileResetPasswordLinkVerify: {
      successMsg: 'Password  reset successfully!',
      errorMsg: 'Customer not exist!',
      codeError: 'code invalid!',
      existError: 'Customer not found!',
      passwordError: 'new password and confirm password do not matched!',
      oldPasswordError: 'Old password do not matched!',
      codeGenError: 'code generate failed! try again!',
      expiredError: 'OTP code is invalid/expired.'
    },
    profileMatchedPasswordReset: {
      successMsg: 'Password reset successfully!',
      errorMsg: 'Failed to reset password!',
      emailError: 'Email invalid!',
      oldPasswordError: 'Old password do not matched!',
      existError: 'Customer not found!',
      passwordError: 'new password and confirm password do not matched!'
    }
  },
  coupon: {
    getCouponByCode: {
      expiredError: 'Invalid coupon or expired!',
      successMsg: 'Great coupon matched!',
      errorMsg: 'Coupon invalid!'
    }
  },
  order: {
    orderCreate: {
      successMsg: 'successfully placed the order!',
      catchError: 'Fail to order something wrong!',
      orderIdGenError: 'Something is wrong!',
      productNotFound: "Please select minimum 1 product!",
      shippingOptionSettingNotFound: "Please Select a valid shipping option & refresh the page!",
      couponNotFound: "Coupon code is expired!",
      amountError: "Fail to order amount is invalid!",
      paymentError: "Failed to create payment information for this order.",
      customerNotFound: "Customer not exist! please login before try  again!"
    },
    getMyOrders: {
      successMsg: 'my Order!',
      catchError: 'My order not found!',
      orderIdGenError: 'Something is wrong!'
    },
    getMySingleOrder: {
      successMsg: 'my Order!',
      catchError: 'My order not found!',
      orderIdGenError: 'Something is wrong!'
    },
    commentsAdd: {
      successMsg: "Comment added successfully!",
      errorMsg: "Comment add to failed!"
    },
  },
  freeBuy: {
    claimFreeBuyThresholdBy: {
      successMsg: 'claim nearby free product is available',
      invalidAmount: 'Total amount is required!',
      errorMsg: 'Unfortunately, claim nearby free product is not available'
    },
    claimFreeBuyShippingBy: {
      successMsg: 'claim nearby free product is available',
      invalidAmount: 'Total amount is required!',
      errorMsg: 'Unfortunately, claim nearby free product is not available'
    },
  }
}
