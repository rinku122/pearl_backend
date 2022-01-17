import { Request, Response, Router } from "express";

import * as Interfaces from "interfaces";
import { Responses } from "../../helpers";
import { requestDecrypt } from "../../middlewares";

import Transaction from "./transaction.model";

class TransactionController implements Interfaces.Controller {
  public path = "/Transaction";
  public router = Router();
  constructor() {
    this.initializeRoutes();
  }

  private async initializeRoutes() {
    this.router
      .all(`${this.path}/*`)

      .get(this.path + "/registeredPerDay", this.registeredPerDay)
      .get(this.path + "/getTotal", this.getTotal)
      .get(this.path + "/getEURValue", this.getEURValue)
      //.get(this.path + "/getTree/:address/:level", this.getTree)
      .get(this.path + "/direct/:address", this.getDirect)
      .get(this.path + "/filled/:address", this.getFilled)
      .get(this.path + "/team/:address", this.getTeam)
      .post(this.path + "/add", requestDecrypt, this.add)
      .post(this.path + "/register", this.register)
      .get(this.path + "/getUserDetail/:address", this.getUserDetail)
      .get(
        this.path + "/getNewUserPlaced/:address/:level/",
        this.getNewUserPlaced
      )
      .get(this.path + "/getReferrals/:address", this.getReferrals)
      .get(this.path + "/directReferralUsers/:address", this.directReferralUsers);
  }



  //Get Transactions
  private async registeredPerDay(req: any, response: Response) {
    try {
      let records: any = await Transaction.totalRegistrationPerDay();
      if (records > 0) {
        return Responses.success(response, records.toString());
      } else {
        return Responses.success(response, "0");
      }
    } catch (error) {
      return Responses.error(response, { message: error });
    }
  }
  //Get Transactions Total
  private async getTotal(req: any, response: Response) {
    try {
      // const records: any = await Transaction.getTotal();
      const records: any = await Transaction.getTotalLogs();

      return Responses.success(response, records);
    } catch (error) {
      console.log(error, "total income error");
      return Responses.error(response, { message: error });
    }
  }

  // Transaction add
  private async add(req: any, response: Response) {
    try {
      const { userAddress } = req.body;

      if (!userAddress) {
        const err: any = new Error("User Address is a required argument");
        err.statusCode = 400;
        return Responses.error(response, err);
      }
      const result: any = await Transaction.add(req.body);
      if (result.status) {
        return Responses.success(response, { status: true });
      } else {
        return Responses.error(response, {
          status: false,
          message: result.message,
        });
      }
    } catch (error) {
      return Responses.error(response, error);
    }
  }
  // get EUR value
  private async getEURValue(req: any, response: Response) {
    try {
      const currency = await Transaction.getEUR();
      return Responses.success(response, { status: true, currency });
    } catch (error) {
      return Responses.error(response, error);
    }
  }
  /**
   * get Tree Array
   * @param  {any} req
   * @param  {Response} response
   */
//   private async getTree(req: any, response: Response) {
//     try {
//       const { address, level } = req.params;
//       if (address) {
//         const result = await Transaction.getNewUserPlacedArr(address, level);
//         return Responses.success(response, result);
//       } else {
//         return Responses.success(response, []);
//       }
//     } catch (error) {
//       return Responses.error(response, error);
//     }
//   }
  /**
   * get Tree Array
   * @param  {any} req
   * @param  {Response} response
   */
  private async getDirect(req: any, response: Response) {
    try {
      const { address } = req.params;
      if (address) {
        const result = await Transaction.getDirctCounts(address);
        return Responses.success(response, { direct: result });
      } else {
        return Responses.success(response, { direct: 0 });
      }
    } catch (error) {
      return Responses.error(response, error);
    }
  }
  /**
   * get Filled
   * @param  {any} req
   * @param  {Response} response
   */
  private async getFilled(req: any, response: Response) {
    try {
      const { address } = req.params;
      if (address) {
        const result = await Transaction.getMatrixFilled(address);
        return Responses.success(response, result);
      } else {
        return Responses.success(response, []);
      }
    } catch (error) {
      return Responses.error(response, error);
    }
  }
  /**
   * get Team
   * @param  {any} req
   * @param  {Response} response
   */
  private async getTeam(req: any, response: Response) {
    try {
      const { address } = req.params;
      if (address) {
        const result = await Transaction.getTeam(address);
        return Responses.success(response, { team: result });
      } else {
        return Responses.success(response, []);
      }
    } catch (error) {
      return Responses.error(response, error);
    }
  }
  private async register(req: any, response: Response) {
    try {
      const records: any = await Transaction.register(req.body);
      if (records.status) {
        return Responses.success(response, { status: true });
      }
    } catch (error) {
      return Responses.error(response, error);
    }
  }
  private async getUserDetail(req: any, response: Response) {
    try {
      console.log("come Here");
      const records: any = await Transaction.getUsers(req.params.address);
      return Responses.success(response, { user: records });
    } catch (error) {
      console.log("error", error);
      return Responses.error(response, error);
    }
  }
  private async getNewUserPlaced(req: any, response: Response) {
    try {
      const { address, level} = req.params;
      if (address) {
        const records: any = await Transaction.getNewUserPlaced(address, level);
        //console.log(records,'==========records');
        return Responses.success(response, {
          status: true,
          newUserPlace: records,
        });
      } else {
        return Responses.success(response, []);
      }
    } catch (err) {
      return Responses.error(response, err);
    }
  }

  private async directReferralUsers(req: any, response: Response) {
    try {
      const { address } = req.params;
      if (address) {
        const records: any = await Transaction.directReferralUsers(address);
       //console.log(records,'==========records');
        return Responses.success(response, {
          status: true,
          refferalsCount: records,
        });
      } else {
        return Responses.success(response, []);
      }
    } catch (err) {
      return Responses.error(response, err);
    }
  }
  private async getReferrals(req: any, response: Response) {
    try {
      const { address } = req.params;
      if (address) {
        const records: any = await Transaction.getReferrals(address);
        return Responses.success(response, {
          status: true,
          referrals: records,
        });
      } else {
        return Responses.success(response, []);
      }
    } catch (err) {
      return Responses.error(response, err);
    }
  }
}

export default TransactionController;
