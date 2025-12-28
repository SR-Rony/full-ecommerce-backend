import Cryptr from "cryptr";
import dotenv from "dotenv";
import mongoose from "mongoose";
import slugify from "slugify";
dotenv.config()
/**
 * Generates a slug from the given text.
 *
 * @param {string} text - The text to generate a slug from.
 * @returns {string} - The generated slug.
 */
export const slugGen = (text) => {
  if (!text) {
    return "";
  }
  return slugify(text, {
    replacement: '-',  // replace spaces with replacement character, defaults to `-`
    remove: undefined, // remove characters that match regex, defaults to `undefined`
    lower: false,      // convert to lower case, defaults to `false`
    strict: false,     // strip special characters except replacement, defaults to `false`
    locale: 'vi',      // language code of the locale to use
    trim: true         // trim leading and trailing replacement chars, defaults to `true`
  });
};

/**
 * Returns a response object for an error scenario.
 *
 * @param {Error|string} error - The error message or object.
 * @param {Array} errors - Additional error details.
 * @param {number} code - The HTTP status code.
 * @returns {Object} - The error response object.
 */
export const responseError = (error, errors, code) => {
  const resData = {
    success: false,
    code: Array.isArray(code)? 400: code || 400,
    message: error?.message || error || 'unknown error occurred',
  };
  if (Array.isArray(errors) && errors?.length) {
    resData['errors'] = errors
  } else {
    delete  resData['errors'] 
    resData['code'] = code ?? (typeof errors == 'number' ?errors: 400)
  }
  return resData
};

/**
 * Returns a response object for a successful scenario.
 *
 * @param {string} message - The success message.
 * @param {any} data - The data to include in the response.
 * @returns {Object} - The success response object.
 */
export const responseSuccess = (message, data) => {
  const resData = {
    success: true,
    code: 200,
    message: message || 'Successful',
    paginate: null,
    data: null
  }

  if (data && data.hasOwnProperty('paginate')) {
    resData['paginate'] = data?.paginate;
  }
  if (data && data.hasOwnProperty('data')) {
    resData['data'] = data?.data
  } else {
    delete resData.paginate
    resData['data'] = data
  }

  return resData
};










/**
 * Finds documents with pagination and optional query, sort, and populate criteria.
 *
 * @param {Object} options - Options for the query.
 * @param {mongoose.Model} options.model - Mongoose model to query.
 * @param {Object} [options.query={}] - Query criteria.
 * @param {Object} [options.sort={ createdAt: -1 }] - Sorting criteria.
 * @param {number} [options.page=1] - Page number.
 * @param {number} [options.limit=10] - Number of documents per page.
 * @param {string|string[]} [options.populate=null] - Field(s) to populate.
 * @param {string} [options.hint=null] - Index hint.
 * @returns {Promise<{results: Array, hasNextPage: boolean}>} - Resolves to an object with the array of documents and a boolean indicating the presence of a next page.
 */
export function areAlmostEqual(num1, num2, epsilon = Number.EPSILON) {
  return Math.abs(num1 - num2) < epsilon;
}

export const findWithPagination = async ({
  model,
  query = {},
  sort = { createdAt: -1 },
  page = 1,
  limit = 10,
  populate = {},
  select = {},
  hint = {},
}) => {
  let pageNum = parseInt(page) || 1;
  let limitNum = parseInt(limit) || 10;
  let paginate = {
    totalCount: 0,
    totalPage: 1,
    currentPage: pageNum,
    currentLimit: limitNum,
    hasNextPage: false
  }
  try {
    const skip = (pageNum - 1) * limitNum;

    let queryBuilder = model.find(query).collation({locale: "en" }).skip(skip).limit(limitNum).lean();
    let queryTotalCountBuilder = model.find(query, { _id: 1 }).countDocuments()
    if (select && Object.keys(select).length > 0) {
      queryBuilder = queryBuilder.select(select);
    }
    if (populate && Object.keys(populate).length > 0) {
      queryBuilder = queryBuilder.populate(populate);
    }

    if (hint && Object.keys(hint).length > 0) {
      queryBuilder = queryBuilder.hint(hint);
    }

    if (sort && Object.keys(sort).length > 0) {
      queryBuilder = queryBuilder.sort(sort);
    }

    const [totalCount, data] = await Promise.all([queryTotalCountBuilder.exec(), queryBuilder.exec()]);
    // Check if there is a next page
    paginate['totalCount'] = totalCount
    paginate['totalPage'] = Math.ceil(totalCount / limitNum)
    paginate['currentPage'] = pageNum;
    paginate['currentLimit'] = limitNum;
    paginate['hasNextPage'] = data?.length === limitNum;

    return { data, paginate };
  } catch (error) {
    throw error;
  }
};

export function isValidEmail(email) {
  if (!email) return false
  // Regular expression for basic email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return emailRegex.test(email);
}

export const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value)
}

export function twoFloatNumConvert(number) {
  // Convert the number to a fixed-point representation with two decimal places
 return parseFloat(Number(number||0)||0).toFixed(2);;
}




export const toParseObject = (_data) => {
  try {
    let data = {}
    if (_data) {
      data = JSON.parse(JSON.stringify(_data))
    }
    return data
  } catch (error) {
    console.log(error)
    return {

    }
  }
}

export function addressConcat(address) {
  if (address && typeof address === 'object') {
    var formattedAddress =
      (address?.streetName || '') +
      ', ' +
      (address?.city || '') +
      ', ' +
      (address?.state || '') +
      ' ' +
      (address?.zipCode || '')

    return formattedAddress
  } else {
    return ''
  }
}


export const isValidArray = (array) => {
  if (Array.isArray(array) && array.length > 0) {
    return true
  } else {
    return false
  }
}



export function isValidDate(value) {
  // Check if the value is a non-empty string
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  // Attempt to create a Date object from the provided string
  const date = new Date(value);

  // Check if the date is valid
  // The isNaN check ensures that the date string is a valid date and not, for example, "Invalid Date"
  return !isNaN(date) && date.toISOString().slice(0, 10) === value; // Compare toISOString to ensure a consistent format
}


const cryptr = new Cryptr(process.env.MAIL_ENCRYPTED_PASSWORD);

// Function to encrypt a string
export function Encrypted(text) {
  return cryptr.encrypt(text);
}

// Function to decrypt a string
export function Decrypted(encryptedText) {
  return cryptr.decrypt(encryptedText);
}