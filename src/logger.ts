import { format } from "date-fns";
import * as winston from "winston";

const logFormat = winston.format.printf(
  info =>
    `${format(new Date(), `MM-dd|HH:mm:ss`)}|${info.level
      .toLowerCase()
      .slice(0, 1)}: ${info.message}`
);

const logger = winston.createLogger({
  format: winston.format.combine(winston.format.colorize(), logFormat),
  transports: [
    new winston.transports.Console({
      level: "warn"
    })
  ]
});

const addLogFile = (fileName: string) => {
  const logFilePath = `logs/${fileName}.log`;
  const fileTransport = new winston.transports.File({
    filename: logFilePath,
    level: "verbose"
  });
  logger.add(fileTransport);
};

export { logger, addLogFile };
