import { addressConcat, findWithPagination, isValidEmail, isValidObjectId, responseError, responseSuccess, slugGen, toParseObject, twoFloatNumConvert } from "./func.js";
import { coloredConsoleFormat, colorfulFormats, logger } from "./logger.js";

/**
 * Function to find documents with pagination and optional query and sort criteria.
 * @function
 * @name findWithPagination
 * @param {Object} options - Options for the query.
 * @param {mongoose.Model} options.model - Mongoose model to query.
 * @param {Object} [options.query={}] - Query criteria.
 * @param {Object} [options.sort={}] - Sorting criteria.
 * @param {number} [options.page=1] - Page number.
 * @param {number} [options.limit=10] - Number of documents per page.
 * @returns {Promise<Array>} - Resolves to an array of documents.
 */

/**
 * Function to generate a response object for an error scenario.
 * @function
 * @name responseError
 * @param {Error|string} error - The error message or object.
 * @param {Array} errors - Additional error details.
 * @param {number} code - The HTTP status code.
 * @returns {Object} - The error response object.
 */

/**
 * Function to generate a response object for a successful scenario.
 * @function
 * @name responseSuccess
 * @param {string} message - The success message.
 * @param {any} data - The data to include in the response.
 * @returns {Object} - The success response object.
 */

/**
 * Function to generate a slug from the given text.
 * @function
 * @name slugGen
 * @param {string} text - The text to generate a slug from.
 * @returns {string} - The generated slug.
 */

/**
 * A Winston log format that adds color to the console output.
 * @type {winston.format.printf}
 * @name coloredConsoleFormat
 */

/**
 * Configures Winston to use colors for log levels.
 * @type {Object.<string, Function>}
 * @name colorfulFormats
 */

/**
 * Winston logger instance configured with colored console output.
 * @type {winston.Logger}
 * @name logger
 */

export {
    coloredConsoleFormat,
    colorfulFormats,
    findWithPagination,
    isValidEmail,
    isValidObjectId,
    logger,
    responseError,
    responseSuccess,
    slugGen,
    toParseObject,
    twoFloatNumConvert,
    addressConcat
};

