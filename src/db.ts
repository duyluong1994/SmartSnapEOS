import low, { LowdbSync } from "lowdb";
import FileSync from "lowdb/adapters/FileSync";

let db:LowdbSync<any>;

const initDatabase = async (fileName:string) => {
  const adapter = new (FileSync as any)(`db/${fileName}.json`);
  db = low(adapter) as unknown as LowdbSync<any>;
  db.defaults({
    scopes: [],
    lastScopeProcessed: "",
    rowStats: {},
  }).write();
};

const getDatabase = () => db;

export { initDatabase, getDatabase };
