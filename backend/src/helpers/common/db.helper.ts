import * as config from "../../config";

class DbHelper {
  constructor() {
   this.initializePool();
  }
  public initializePool() {
    //initializing config variables first
    config.initiate();
  }
}
export default new DbHelper();
