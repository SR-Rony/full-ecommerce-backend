import mongoose from "mongoose";
import { siteDomains } from "../config/constant.js";
const { Schema } = mongoose

const OrderSchema = new Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Please login before order this products!"],
    },
    orderId: {
      type: String,
      unique: true,
      required: [true, "order id is invalid!"],
    },
    payment: {
      payerAddress: {
        type: String,
        default: null
      },//payment from address
      receiverAddress: {
        type: String,
        default: null
      },// pay to address, randomly generated addresses by nowpayment.
      isPaymentCompleted: {
        type: Boolean,
        default: false,
      },
      paymentId: {
        type: String,
        default: null,
        required: false,
      },
      paymentCreatedAt: {
        type: Date,
        default: null,
        required: false,
      },
      paymentMethod: {
        type: String,
        enum: ['nowpayments', 'btcpay'],
        default: 'btcpay'
      },
      status: {
        type: String,
        enum: [
          "waiting",
          "confirming",
          "confirmed",
          "sending",
          "partially_paid",
          "finished",
          "failed",
          "refunded",
          "expired",
        ],
        default: "waiting",
        lowercase: true,
      },
      paidAmount: {
        type: String,
        default: '0'
      },//this is btc amount
      paidAmountUSD: {
        type: String,
        default: '0'
      },
      paidAt: {
        type: Date,
        default: null,
      },
      usedCreditAmount: {
        type: Number,
        default: 0,
      }
    },
    products: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "products*.product is required!"],
        },
        title: {
          type: String,
          required: [true, "products*.title is required!"],
        },
        quantity: {
          type: Number,
          default: 1,
        },
        price: {
          regular: {
            type: String,
            required: [true, "products*.price.regular  is required!"],
          },
          sale: {
            type: String,
            required: [true, "products*.price.sale  is required!"],
          },
        },
        totalAmount: { // totalAmount after coupon is also applied.
          type: String,
          required: false,
          default: null,
        },
        bundleProducts: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product"
        }],
        isBundle: {
          type: Boolean,
          default: false
        },
        subTitle: {
          type: String,
          default: null
        },
        bundleSize: {
          type: Number,
          default: 0
        },
        cycle: {
          isCycle: {
            type: Boolean,
            default: false
          },
          cycleIncludes: [
            {
              product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
              },
              title: {
                type: String,
              },
              quantity: {
                type: Number,
              },
              price: {
                regular: {
                  type: String,
                },
                sale: {
                  type: String,
                }
              },
              dosage: {
                type: String
              }
            }],
        }
      },
    ],

    freeBuy: {
      isFreeBuy: {
        type: Boolean,
        default: false
      },
      freeBuyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FreeBuy",
        default: null,
      },
      freeBuyProduct: {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: false,
        },
        title: {
          type: String,
          required: false,
        },

        quantity: {
          type: Number,
          default: 0,
        },
        price: {
          regular: {
            type: String,
            required: false,
          },
          sale: {
            type: String,
            required: false,
          },
        },
        subTitle: {
          type: String,
          required: false,
        },
        bundle: {
          isBundle: {
            type: Boolean,
            default: false
          },
          bundleProducts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
          }],

          bundleSize: {
            type: Number,
            default: 0
          },
        },
        cycle: {
          isCycle: {
            type: Boolean,
            default: false
          },
          cycleIncludes: [
            {
              product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
              },
              title: {
                type: String,

              },
              quantity: {
                type: Number,
              },
              price: {
                regular: {
                  type: String,
                },
                sale: {
                  type: String,
                }
              },
              dosage: {
                type: String
              }
            }],
        }

      },
      minimumThreshold: {
        type: String,
        default: '0'
      },
    },

    orderSummary: {
      productsSubtotal: {
        type: String,
        required: [true, "orderSummary.productsSubtotal is required!"],
      },
      shippingCost: {
        type: String,
        required: [true, "orderSummary.shippingCost is required!"],
      },
      totalSaving: {
        type: String,
        required: [true, "orderSummary.totalSaving is required!"],
      },
      totalAmount: {
        type: String,
        required: [true, "orderSummary.totalAmount is required!"],
      },
      coupon: {
        coupon: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Coupon",
          default: null,
        },
        amount: {
          type: String,
          default: 0
        },
        code: {
          type: String,
          default: null,
        },
      },
    },

    shipping: {
      shippingOptionSetting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ShippingOptionSetting",
      },
      arrivalNote: {
        type: String
      },
      shippingNote:{
        type:String,
        default:null
      },
      address: {
        street: {
          type: String,
          default: null,
        },
        streetName: {
          type: String,
          default: null,
        },
        streetNumber: {
          type: String,
          default: null,
        },
        aptUnit: {
          type: String,
          default: null,
        },
        city: {
          type: String,
          default: null,
        },
        state: {
          type: String,
          default: null,
        },
        zip: {
          type: String,
          default: null,
        },
        zipCode: {
          type: String,
          default: null,
        },
        country: {
          label: { type: String, default: null },
          value: { type: String, default: null },
        },
        receiverName: {
          firstName: {
            type: String,
            default: null,
          },
          lastName: {
            type: String,
            default: null,
          },
          fullName: {
            type: String,
            default: null,
          },
        },
      },
      email: { type: String, default: null, lowercase: true },
      phone: { type: String, default: null },
      phoneNum: { type: String, default: null },

      // EasyPost shipping fields
      shipmentId: {
        type: String,
        default: null,
      },
      trackingCode: {
        type: String,
        default: null,
      },
      trackingUrl: {
        type: String,
        default: null,
      },
      trackingStatus: {
        type: String,
        default: null,
      },
      trackingDetails: [{
        object: String,
        message: String,
        status: String,
        status_detail: String,
        datetime: String,
        city: String,
        state: String,
        zip: String,
        country: String,
        tracking_location: {
          object: String,
          city: String,
          state: String,
          country: String
        }
      }],
      carrier: {
        type: String,
        default: null,
      },
      service: {
        type: String,
        default: null,
      },
      labelUrl: {
        type: String,
        default: null,
      },
      labelData: {
        type: String,
        default: null,
      },
      shippingCost: {
        type: Number,
        default: 0,
      },
      availableRates: [{
        id: String,
        service: String,
        carrier: String,
        rate: Number,
        currency: String,
        delivery_days: Number,
        delivery_date: Date,
        delivery_date_guaranteed: Boolean,
        estimated_delivery_date: String,
        shipping_amount: Number,
        carrier_account_id: String
      }],
      selectedRate: {
        id: String,
        service: String,
        carrier: String,
        rate: Number,
        currency: String,
        delivery_days: Number,
        delivery_date: Date,
        delivery_date_guaranteed: Boolean,
        estimated_delivery_date: String,
        shipping_amount: Number,
        carrier_account_id: String
      },
      shippedAt: {
        type: Date,
        default: null,
      },
      deliveredAt: {
        type: Date,
        default: null,
      },
      autoProcessed: {
        type: Boolean,
        default: false,
      },
      batchId: {
        type: String,
        default: null,
      }
    },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "PACKED", "PARTIALLY_SHIPPED", "FULLY_SHIPPED", "DELIVERED", "CANCELLED"],
      uppercase: true,
      default: "PENDING",
    },
    statusUpdatedAtRecords: [
      {
        status: String,
        updatedAt: Date,
      },
    ],
    tracking: {
      numbers: [String],
    },
    comments: [{
      createdByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        default: null
      },

      createdByCustomer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        default: null
      },
      sendEmailAsWell: {
        type: Boolean,
        default: true
      },
      message: {
        type: String,
        trim: true,
        validate: {
          validator: (value) => value.length <= 250,
          message: 'message cannot exceed 250 characters.'
        }
      },
      createdAt: {
        type: Date,
        default: Date.now()
      }
    }],
    orderReview: {
      reviewMessage: {
        type: String,
        trim: true,
        validate: {
          validator: (value) => value.length <= 250,
          message: 'message cannot exceed 250 characters.'
        }
      },
      ratingStar: {
        type: Number,
        min: 0,
        max: 5
      },
      createdAt: {
        type: Date
      }
    },
    site: {
      type: String, //ex: hb,auctropin
      default: 'hb'
    },
    editedByAdmins: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product"
        },
        quantity: {
          type: Number,
          required: false,
          default: null,
        },
        status: {
          enum: ["removed", "added"],
          type: String,
          required: true,
        }
      }
    ],
    markAsPaidByAdmin: {
      type: Boolean,
      default: false,
    },
    origin: {
      type: String,
      default: siteDomains.default,
    },
    originalOrder: {
      type: Object,
      required: false,
      default: null,
    },
    isTestOrder: {
      type: Boolean,
      default: false,
    },
    orderPaymentExiredMailSentAt: {
      type: Date,
      default: null,
      required: false,
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
OrderSchema.path('comments').default([]);
OrderSchema.path('tracking.numbers').default([]);

const OrderModel = mongoose.model("Order", OrderSchema);

export default OrderModel;
