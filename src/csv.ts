import * as fs from "fs";
import { createObjectCsvWriter } from "csv-writer";

import { ExtendedRow } from "./snapshot";

const initCsv = (fileName: string, headers: string[]) => {
  const csvWriter = createObjectCsvWriter({
    path: `snapshots/${fileName}.csv`,
    header: headers.map(header => ({
      id: header,
      title: header
    })),
    append: true,
  });

  return csvWriter
};

export {
    initCsv
}