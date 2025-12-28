/**
 * Application configuration object.
 * @typedef {Object} AppConfig
 * @property {string} DB - MongoDB URI.
 * @property {Object} LISTEN - Configuration for the listening server.
 * @property {number} LISTEN.PORT - Port number for the server.
 * @property {Object} JWT - Configuration for JSON Web Tokens.
 * @property {string} JWT.JWT_SECRET - Secret key for JWT.
 */

/**
 * Application configuration.
 * @type {AppConfig}
 */
import dotenv from 'dotenv';
dotenv.config()
const {
  MONGODB_URI,
   PORT,
    JWT_SECRET,
    REDIS_PORT,
    REDIS_URL,
    REDIS_PASSWORD,
    REDIS_SOCKET,
    FRONT_END_URL_CUSTOMER,
    FRONT_END_URL_ADMIN,
    ADMIN_EMAIL,
    MAIL_FROM_ADDRESS,
    CONTACT_TO_EMAIL,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    RATE_LIMIT_REQUEST_PER_HOUR,
    EASYPOST_API_KEY,
    EASYPOST_WEBHOOK_SECRET,
    EASYPOST_TEST_MODE,
    SENDER_ADDRESS_STREET,
    SENDER_ADDRESS_CITY,
    SENDER_ADDRESS_STATE,
    SENDER_ADDRESS_ZIP,
    SENDER_ADDRESS_COUNTRY,
    SENDER_NAME,
    SENDER_EMAIL,
    SENDER_PHONE
   } = process.env;
// console.log(JWT_SECRET)
/**
 * Application configuration object.
 * @type {AppConfig}
 */
const CONFIG = {

  DB: {
    MONGODB:{
      MONGODB_URI
    },
    REDIS:{
      REDIS_PORT,
      REDIS_URL,
      REDIS_PASSWORD,
      REDIS_SOCKET,
    }
  },
  BASE:{
    FRONT_END_URL_CUSTOMER,
    FRONT_END_URL_ADMIN
  },
  MAIL_SETTING:{
    MAIL_FROM_ADDRESS,
    CONTACT_TO_EMAIL,
    ADMIN_EMAIL,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS
  },
  LISTEN: {
    PORT: PORT || 8000,
  },
  JWT: {
    JWT_SECRET,
  },
  EASYPOST: {
    API_KEY: EASYPOST_API_KEY,
    WEBHOOK_SECRET: EASYPOST_WEBHOOK_SECRET,
    TEST_MODE: EASYPOST_TEST_MODE === 'true',
    SENDER_ADDRESS: {
      street: SENDER_ADDRESS_STREET,
      city: SENDER_ADDRESS_CITY,
      state: SENDER_ADDRESS_STATE,
      zip: SENDER_ADDRESS_ZIP,
      country: SENDER_ADDRESS_COUNTRY,
      name: SENDER_NAME,
      email: SENDER_EMAIL,
      phone: SENDER_PHONE
    }
  },
};

export default CONFIG;