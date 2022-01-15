// import * as SqlString from "sqlstring";
import BaseModel from "../../model/base.model";

import * as Helpers from "../../helpers";

import {
  ReInvestment,
  NewUserPlaced,
  FreePosition,
  Registration,
} from "./schema";
import Transaction from "./transaction.model";

const TronWeb = require("tronweb");

class Matrix extends BaseModel {
  public TRONGRID_API = process.env.TRONGRID_API!;
  public tronWeb: any;
  public myContractOb: any;
  public contractAddress = process.env.CONTRACT_ADDRESS;
  public DEFAULT_ADDRESS = process.env.DEFAULT_ADDRESS!;
  public BLOCK_NUMBER = process.env.BLOCK_NUMBER!;
  public default_address_hex = process.env.DEFAULT_HEX!;

  constructor() {
    super();
    this.tronWeb = new TronWeb(
      {
        fullNode: this.TRONGRID_API,
        solidityNode: this.TRONGRID_API,
        eventServer: this.TRONGRID_API,
      },
      "089ed827a0e5f7bfb50fcf64d4836c11e2b80344f17f107581fe6b3f2c2e49b6"
      // '7A391C88137C9D7F5B8CA7E61ABC1F7E7B389B4280A2B28ABA7EDB336AC10298'
    );
  }

  /**
   * call Contract from Tronweb
   * @param
   * @returns {Object}
   */
  private async callContract(): Promise<any> {
    if (this.myContractOb) {
      return this.myContractOb;
    } else {
      try {
        this.myContractOb = this.tronWeb.contract().at(this.contractAddress);
        return this.myContractOb;
      } catch (err) {
        // console.log(err.message, "first contract");
        if (err.message === "Request failed with status code 503") {
          this.myContractOb = this.tronWeb.contract().at(this.contractAddress);
          return this.myContractOb;
        } else {
          return err;
        }
      }
    }
  }

  private insertNewUserPlace(freePos: any, user: any) {
    return new Promise(async (resolve, reject) => {
      const newUserPlace: any = new NewUserPlaced({
        level: freePos.level,
        place: freePos.currentPlace,
        referrer: freePos.referrerAddress,
        user: user,
      });
      const res: any = await newUserPlace.save();
      if (res) {
        const res: any = await this.updateFreePos(freePos, "user");
      }
    });
  }

  private updateFreePos(freePos: any, user: string) {
    return new Promise(async (resolve, reject) => {
      const currentLevel =
        freePos.currentPlace === 3 ** freePos.level
          ? freePos.level + 1
          : freePos.level;
      const currentPlace =
        freePos.currentPlace === 3 ** freePos.level
          ? 1
          : freePos.currentPlace + 1;
      const result: any = await NewUserPlaced.findOne({
        place: 1,
        level: freePos.level,
      });
      const freePosition: any = {
        level: currentLevel,
        place: currentPlace,
        user: user,
        referrer: result.user,
      };

      const res: any = await freePosition.save();
    });
  }

  private checkTreeReverse(user: any) {
    return new Promise(async (resolve, reject) => {
      for (let i = 0; i <= 20; i++) {}
    });
  }

  private async getUser(user: string) {
    return new Promise(async (resolve, reject) => {
      let obj = await Registration.findOne({ user });
      return resolve(obj);
    });
  }

  private async referrerArray(user: string) {
    let arr: any = [];
    return new Promise(async (resolve, reject) => {
      for (let i = 1; i <= 10; i++) {
        let obj = await NewUserPlaced.findOne({ user, level: i });
        // // console.log(obj, 'referrerAddress line no 439 manish', i);
        if (obj) {
          let r = obj.referrerAddress;

          // if (r.toLowerCase() === this.default_address_hex?.toLowerCase()) {
          //   referrer = obj.referrer;
          // }
          const a: any = { referrerAddress: r, i };
          arr = [...arr, a];
        } else {
          return resolve(arr);
        }
      }
      return resolve(arr);
    });
  }

  public async createTree(data: any, amount: number): Promise<any> {
    try {
      const obj = new NewUserPlaced({ data });
      return await obj.save();
    } catch (err) {
      return err;
    }
  }

  public async callTree(userAddress: string): Promise<any> {
    let treeArrs = [];
    userAddress = await Transaction.convertAddressToHex(userAddress);
    userAddress = userAddress.replace("41", "0x");

    // const user: any = await Registration.findOne({ user: userAddress });
    // // console.log(user, "User details here");

    // const referrer = user.referrer;
    const freePos: any = await FreePosition.findOne({
      referrer: userAddress,
    });
    // console.log(freePos, "data................................");
    const currentReferrer = freePos.referrer;
    let level = 1;
    const place = freePos.place + 1;
    // console.log("currentReferrer: ", currentReferrer);

    const obj = {
      user: userAddress,
      referrerAddress: currentReferrer,
      level,
      place,
    };
    const r = await this.createTree(obj, 100);
    // console.log("insert first level");

    const referrerArry: any = await this.referrerArray(currentReferrer);
    // console.log(referrerArry, "referrerArry");

    for (let ob of referrerArry) {
      level++;
      const r = await this.createTree(
        {
          user: userAddress,
          referrerAddress: ob.referrerAddress,
          level,
          place: 0,
        },
        100
      );
      // console.log("insert level");
    }

    // resolve({ level, currentReferrer, referrerArry, referrerAddress, currentPlace });
    return true;
  }
}

export default new Matrix();
