import winston from "winston";
import chalk from "chalk";
import moment from 'moment'
/**
 * Configures Winston to use colors for log levels.
 * @type {Object.<string, Function>}
 */
export const customLogFormat =  (tokens, req, res) => {
  // Get the status code of the response
  const status = res.statusCode;

  // Use chalk to add color to the log output
  const color =
    status >= 500
      ? 'red'
      : status >= 400
      ? 'yellow'
      : status >= 300
      ? 'pink'
      : status >= 200
      ? 'green'
      : 'white';

  // Ensure that color is a valid chalk color
  const validColor = chalk[color] ? color : 'green';

  // Customize the log format
  return [
    chalk.bold(`[${moment().format('YYYY-MM-DD')}]`), // Make the timestamp bold
    chalk[validColor](`[${tokens.method(req, res)}]`), // Use color for the HTTP method
    chalk[validColor](`[${tokens.status(req, res)}]`), // Use color for the status code
    chalk[validColor](`[${tokens.url(req, res)}]`), // Use color for the URL
    chalk.grey(`- ${tokens.res(req, res, 'content-length') || '0'} bytes`), // Use grey color for content length
    chalk.magenta(`- ${tokens['response-time'](req, res)} ms`), // Use magenta color for response time
  ].join(' ');
};
export const colorfulFormats = {
  error: chalk.red.bold,
  warn: chalk.yellow.bold,
  info: chalk.green.bold,
  http: chalk.magenta.bold,
  debug: chalk.gray,
};

/**
 * A Winston log format that adds color to the console output.
 * @type {winston.format.printf}
 */
export const coloredConsoleFormat = winston.format.printf(({ level, message }) => {
  const coloredLevel = colorfulFormats[level.toLowerCase()](`[${level.toUpperCase()}]`);
  return `${coloredLevel} ${message}`;
});

/**
 * Winston logger instance configured with colored console output.
 * @type {winston.Logger}
 */
export const logger = winston.createLogger({
  /**
   * Winston log format configuration.
   * @type {winston.Logform.Format}
   */
  format: winston.format.combine(
    winston.format.timestamp(),
    coloredConsoleFormat
  ),
  /**
   * Winston transports configuration.
   * @type {Array<winston.transport>}
   */
  transports: [
    new winston.transports.Console(),
    // Add more transports as needed (e.g., file transport)
  ],
});
