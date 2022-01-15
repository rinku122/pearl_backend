import { Request, Response, Router } from "express";
import { Parser } from "json2csv";

import * as Interfaces from "interfaces";
import { Responses } from "../../helpers";

import Account from "./account.model";

class AccountController implements Interfaces.Controller {
  public path = "/Account";
  public router = Router();
  constructor() {
    this.initializeRoutes();
  }

  private async initializeRoutes() {
    this.router
      .all(`${this.path}/*`)
      .get(this.path + "/getAll", this.getAccounts)
      .get(this.path + "/totalParticipants", this.totalParticipants)
      .get(this.path + "/eventlog", this.eventLog)
      .get(this.path + "/usersCheck/:address", this.checkForRegister)
      .get(this.path + "/lastLogin/:address", this.register);

    // .post(
    //     this.path + "/resetPassword",
    //     this.resetPassword
    // )
  }

  //user pool update
  private async totalParticipants(req: any, response: Response) {
    try {
      const records: any = await Account.totalParticipants();
      if (records) {
        return Responses.success(response, records.toString());
      } else {
        return Responses.success(response, 0);
      }
    } catch (error) {
      return Responses.error(response, error);
    }
  }

  //get event log
  private async eventLog(req: any, response: Response) {
    try {
      const records: any = await Account.eventLog("", []);
      if (records) {
        // console.log('controller', records);
        const json2csv = new Parser({});
        const csv = json2csv.parse(records);
        response.header("Content-Type", "text/csv");
        response.attachment("event.csv");
        return response.status(200).send(csv);
      } else {
        return Responses.success(response, []);
      }
    } catch (error) {
      return Responses.error(response, error);
    }
  }

  //Get Accounts
  private async getAccounts(req: any, response: Response) {
    const skipNum = parseInt(req.query.skipNum) || 0;

    return Responses.success(response, "Ok");
  }

  private async register(req: any, response: Response) {
    const { address } = req.params;
    try {
      // console.log("address111111", address)
      const response1: any = await Account.register(address);
      return Responses.success(response, {
        status: true,
        lastLoginDetails: response1,
      });
    } catch (error) {
      return Responses.error(response, error);
    }
  }

  private async checkForRegister(req: any, response: Response) {
    try {
      const { address } = req.params;
      const response1: any = await Account.checkForRegister(address);
      if (response1) {
        return Responses.success(response, {
          status: true,
          lastLoginDetails: response1,
        });
      } else {
        return Responses.success(response, {
          status: false,
          lastLoginDetails: response1,
        });
      }
    } catch (error) {
      return Responses.error(response, error);
    }
  }

  private async getLoginDeatils(req: any, response: Response) {
    try {
      const records: any = await Account.getLoginDetails(req.params.address);
    } catch (error) {}
  }
}

export default AccountController;
