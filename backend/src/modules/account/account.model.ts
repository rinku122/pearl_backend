// import * as SqlString from "sqlstring";
import BaseModel from "../../model/base.model";

import { API_MSG } from "../../constant/response";
// import Web3 from 'tronweb';
import * as TransactionSchema from "../transaction/schema";
import abi from "./../../bin/myContractABI.json";
const TronWeb = require("tronweb");
const myContract = require("../../bin/myContractABI.json");
// const myContractLive = require('../../bin/myContractLive.json');

class Account extends BaseModel {
  public TRONGRID_API = process.env.TRONGRID_API!;
  public tronWeb: any;
  public myContractOb: any;
  //public TRONGRID_API_LIVE = 'https://3.21.162.137:8546';
  public contractAddress = process.env.CONTRACT_ADDRESS;
  public DEFAULT_ADDRESS = process.env.DEFAULT_ADDRESS!;
  public BLOCK_NUMBER = process.env.BLOCK_NUMBER!;

  constructor() {
    super();
    this.tronWeb = new TronWeb(
      {
        fullNode: this.TRONGRID_API,
        solidityNode: this.TRONGRID_API,
        eventServer: this.TRONGRID_API,
      },
      "068ba7c9ec9b92bbff167e3c8d3b9372854ffa7a28d7da6fb3225c05bd0054e2"
    );
  }
  private async callContract() {
    try {
      if (this.myContractOb) {
        return this.myContractOb;
      } else {
        this.myContractOb = await this.tronWeb.contract(
          abi,
          this.contractAddress
        );
        return this.myContractOb;
      }
    } catch (error) {
      console.log(error);
    }
  }
  // public async UserPoolIncome(address: string) {
  //     return new Promise(async (resolve, reject) => {
  //         try {
  //             const tronweb = new Web3(this.TRONGRID_API_LIVE);
  //             const contract = new tronweb.eth.Contract(myContractLive, this.contractAddressLive);

  //             contract.getPastEvents('UserPoolIncome', {
  //                 filter: { user: address }, // Using an array means OR: e.g. 20 or 23
  //                 fromBlock: 0
  //             }, (error, event) => {
  //                 if (error) {
  //                     return reject(error);
  //                 }
  //                 // console.log(event, 'pool income');
  //                 resolve(event);
  //             });
  //         } catch (error) { reject(error) }
  //     });
  // }

  public async totalParticipants() {
    return new Promise(async (resolve, reject) => {
      try {
        let records: any = await TransactionSchema.Registration.countDocuments(
          {}
        );
        const contract = await this.callContract();
        contract
          .currentUserId()
          .call({ _isConstant: true })
          .then((res: any) => {
            let d = 0;
            if (parseInt(res) > 0) {
              d = parseInt(res) - 1;
              return resolve(d.toString());
            }
            resolve("0");
          })
          .catch(reject);
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  }
  public async eventLog(fingerprint = "", arr: any) {
    return new Promise(async (resolve, reject) => {
      const r = await this.getLog(fingerprint, arr);
      resolve(r);
    });
  }
  public async convertAddressToHex(address: string) {
    if (address.indexOf("41") === 0) {
      //console.log(address,'================convert')
      return address;
    }
    return await this.tronWeb.address.toHex(address);
  }
  private async getLog(fingerprint: string, n: any): Promise<any> {
    try {
      const event = await this.tronWeb.getEventResult(this.contractAddress, {
        fromBlock: this.BLOCK_NUMBER,
        size: 200,
        fingerprint,
      });
      if (event.length > 0) {
        // console.log(event[event.length - 1], 'last');
        const lastRecord: any = event[event.length - 1];

        const r = await event.map((d: any) => {
          const returnValues: any = d.result;
          returnValues.transactionHash = d.transaction;
          returnValues.timestamp = d.timestamp;
          returnValues.event = d.name;
          return returnValues;
        });
        if (!lastRecord.fingerprint) {
          //recurrsive
          n = n.concat(r);
          return n;
        } else {
          console.log(r.length, "in recurrsive call");
          n = n.concat(r);
          return await this.getLog(lastRecord.fingerprint, n);
        }
      } else {
        return n;
      }
    } catch (error) {
      console.log(error);
    }
  }
  public async register(user: string) {
    try {
      if (user.indexOf("41") !== -1) {
        user = user.replace("41", "0x");
      } else {
        user = await this.convertAddressToHex(user);
        user = user.replace("41", "0x");
      }
      let registerdata: any = await TransactionSchema.Registration.find({
        userAddress: user,
      });
      var data: any = await TransactionSchema.LastLogin.find({
        user: user,
      }).sort({ createdAt: -1 });
      await new TransactionSchema.LastLogin({ user }).save();
      let timeStamp =
        data.length > 0
          ? new Date(data[0].createdAt).getTime()
          : parseInt(registerdata[0].timestamp);
      var reponse = {
        joined: parseInt(registerdata[0].timestamp),
        lastLogin: timeStamp,
      };

      //console.log("data", reponse)
      return reponse;
    } catch (error) {
      console.log("errort", error);
      throw error;
    }
  }

  public async checkForRegister(user: string) {
    try {
      if (user.indexOf("41") !== -1) {
        user = user.replace("41", "0x");
      } else {
        user = await this.convertAddressToHex(user);
        user = user.replace("41", "0x");
      }
      let reponse: any = await TransactionSchema.Registration.findOne({
        userAddress: user,
      });

      return reponse;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }

  public async getLoginDetails(address: any) {
    return new Promise((resolve, reject) => {});
  }
}

export default new Account();
