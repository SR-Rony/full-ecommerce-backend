import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required!']
    },
    subTitle: {
      type: String,
      required: false,
      default: null
    },
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }],
    isNewLook: {
      type: Boolean,
      required: false,
      default: false,
    },
    details: {
      description: {
        type: String,
        required: [true, 'Description is required!']
      },
      dose: {
        type: String,
        default: null
      },
      doseDetails: {
        type: String,
        default: null,
      },
      effectiveTime: {
        type: String,
        default: null
      },
      benefits: {
        type: Array,
        default: []
      },
      includes: [{
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        },
        name: {
          type: String,
          default: null
        },
        quantity: {
          type: String
        },
        dosage: {
          type: String,
        },
        title: {
          type: String,
        },
      }],
      cycleLength: {
        type: String,
        default: null
      },
    },
    price: {
      regular: {
        type: Number,
        required: [true, 'Regular price is required!']
      },
      sale: {
        type: Number,
        required: [true, 'Sale price is required!']
      }
    },
    isSoldOut: {
      type: Boolean,
      default: false
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      required: [true, 'Slug is required!']
    },
    stats: {
      viewCount: { type: Number, default: 0 },
      totalSoldCount: { type: Number, default: 0 },
      totalSoldAmount: { type: Number, default: 0 },
      lastSoldAt: { type: Date, default: null }
    },

    images: [
      {
        imgUrl: { type: String },
        isFeatured: { type: Boolean, default: false }
      }
    ],
    isActive: { type: Boolean, default: true },
    ratingInfo: {
      avgRating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
      totalStarSumCount: { type: Number, default: 0 }
    },
    featured: {
      on: {
        type: Boolean,
        default: false
      },
      priority: {
        type: Number,
        default: 0
      }
    },
    cycle: {
      isCycle: { type: Boolean, default: false },
      cycleGroup: { type: String, default: null }
    },
    bundle: {
      isLimited: {
        type: Boolean,
        default: false
      },
      size: {
        type: String,
        default: null
      },
      products: [
        { type: mongoose.Types.ObjectId, ref: "Product" }
      ]
    },
    isGeneral: {
      type: Boolean,
      default: true
    },
    isCurrentDeal: {
      type: Boolean,
      default: false
    },
    seo: {
      metaDescription: {
        type: String,
        default: null
      },
      keywords: {
        type: Array,
        default: []
      },
    },

    availability: {
      isInternational: {
        type: Boolean,
        default: false,
      },
      countries: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ShippingCountry'
      }]
    },
    showAsNewProduct: {
      type: Boolean,
      default: false
    },
    newArrivalDisplayOrder: {
      type: Number,
      default: 0
    },
    comprisedOf: {
      type: Array,
      default: []
    },
    site: {
      type: String, //ex: hb,auctropin
      default: 'hb'
    },
    hasWarningFlag: {
      type: Boolean,
      default: false,

    },
    warningText: {
      type: String,
      default: null,
    },
    warningTextColor: {
      type: String,
      default: null,
    },
    warningBgColor: {
      type: String,
      default: null,
    },
    warningIconColor: {
      type: String,
      default: null,
    },
    displayCoupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null
    },
    createdByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    lastActionByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    productType: {
      type: String,
      default: null,
      required: false,
    },
    topMenuCategory: {
      type: String,
      default: null,
      required: false,
    },
    restrictOptions: {
      isRestricted: {
        type: Boolean,
        default: false
      },
      customers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Customer'
        }
      ]
    }
  },
  { timestamps: true, versionKey: false, }
)
const ProductModel = mongoose.model('Product', ProductSchema)

export default ProductModel
