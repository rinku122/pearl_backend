// import * as SqlString from "sqlstring";
import BaseModel from "../../model/base.model";

import { API_MSG } from "../../constant/response";
import TransactionHelper from "./Transaction.helper";

import * as Helpers from "../../helpers";
import { Console, count } from "console";
// import TransactionSchema from './transaction.schema.model';
import {
  Registration,
  MissedIncome,
  NewUserPlaced,
  UserIncome,
  LevelPurchased,
} from "./schema";

const TronWeb = require("tronweb");

class Transaction extends BaseModel {
  public TRONGRID_API = process.env.TRONGRID_API!;
  public tronWeb: any;
  public myContractOb: any;
  public contractAddress = process.env.CONTRACT_ADDRESS;
  public DEFAULT_ADDRESS = process.env.DEFAULT_ADDRESS!;
  public BLOCK_NUMBER = process.env.BLOCK_NUMBER!;
  public socketObj: any;

  constructor() {
    super();
    // this.tronWeb = new Web3('http://52.52.96.207:8545');
    // this.myContractOb = new this.tronWeb.eth.Contract(myContract, this.contractAddress);
    // this.myContractOb;

    //     const HttpProvider = TronWeb.providers.HttpProvider;
    this.tronWeb = new TronWeb(
      {
        fullNode: this.TRONGRID_API,
        solidityNode: this.TRONGRID_API,
        eventServer: this.TRONGRID_API,
      },
      "8357e6941b746c8cbfa7c5e9a61157309c47caf7c65aaa9c81f9a73339b086e1"
    );
  }
  //calling the contract
  private async callContract() {
    return new Promise((resolve, reject) => {
      if (this.myContractOb) {
        resolve(this.myContractOb);
      } else {
        this.tronWeb
          .contract()
          .at(this.contractAddress)
          .then((contract: any) => {
            this.myContractOb = contract;

            resolve(this.myContractOb);
          })
          .catch((err: any) => {
            console.log(err.message, "first contract");
            if (err.message === "Request failed with status code 503") {
              this.tronWeb
                .contract()
                .at(this.contractAddress)
                .then(resolve)
                .catch(reject);
            } else {
              reject(err);
            }
          });
      }
    });
  }

  /**
   * get all transactions
   * @param userAddress
   */
  public async getAll(userAddress: string, urlQuery: any) {
    return new Promise(async (resolve, reject) => {
      let query = `SELECT * FROM transactions WHERE userAddress='${userAddress}'`;
      if (urlQuery.level) {
        query += ` AND level='${urlQuery.level}'`;
      }
      if (urlQuery.matrix) {
        query += ` AND matrix='${urlQuery.matrix}'`;
      }

      query += ` ORDER BY id DESC`;
      try {
        const records: any = await this.callQuerys(query);
        if (records.length > 0) {
          resolve({ status: true, data: records });
        } else {
          resolve({ status: false, message: "No record found" });
        }
      } catch (error) {
        resolve(error);
      }
    });
  }
  /**
   * Insert Transaction
   * @param data
   */
  public async add(data: any) {
    return new Promise(async (resolve, reject) => {
      const userId = data.userId || "";
      const upline = data.upline || "";
      const level = data.level || "";
      const matrix = data.matrix || "";
      const query = `INSERT INTO transactions SET
                userAddress='${data.userAddress}',
                upline='${upline}',
                userId='${userId}',
                level='${level}',
                matrix='${matrix}',
                transactionHash='${data.transactionHash}',
                response='${JSON.stringify(data.response)}',
                message='${data.message}',
                loginType='${data.loginType}',
                amount='${data.amount}',
                transactionType='${data.transactionType}';`;

      try {
        // console.log('request query', query);
        const result: any = await this.callQuery(query);
        if (result) {
          resolve({ status: true, id: result.insertId });
        } else {
          resolve({ status: false, message: API_MSG.SQL_QUERY_ERROR });
        }
      } catch (error) {
        resolve({ status: false, message: error.sqlMessage });
      }
    });
  }

  public async totalRegistrationPerDay() {
    return new Promise(async (resolve, reject) => {
      const now = new Date(new Date().toDateString()).getTime();
      // let records: any = await Helpers.RedisHelper.getString('Registration');
      // records = JSON.parse(records);
      // records = records.filter((d: any) => d.timestamp >= now)
      let records: any = await Registration.find({ timestamp: { $gte: now } });
      try {
        if (records.length > 0) {
          resolve(records.length);
        } else {
          resolve(0);
        }
      } catch (error) {
        resolve(error);
      }
    });
  }

  /**
   * get all transactions total
   * @param
   */
  public async getTotal() {
    return new Promise(async (resolve, reject) => {
      const query = `SELECT sum(amount) as total FROM transactions WHERE message='success'`;
      try {
        const query2 = `SELECT eur  FROM currencyData WHERE currency='ether'`;
        const records2: any = await this.callQuerys(query2);

        const eur: any = records2[0].eur;

        const records: any = await this.callQuerys(query);
        if (records.length > 0) {
          records[0].total += 200;
          resolve({
            ether: records[0].total,
            eur: parseInt((eur * records[0].total).toString()),
          });
        } else {
          resolve({ ether: 0, eur: 0 });
        }
      } catch (error) {
        resolve(error);
      }
    });
  }

  public async getTotalLogs() {
    return new Promise(async (resolve, reject) => {
      try {
        // const query2 = `SELECT eur  FROM currencyData WHERE currency='ether'`;
        // const records2: any = await this.callQuerys(query2);
        // const eur: any = records2[0].eur;
        // const query2 = `SELECT eur  FROM currencyData WHERE currency='ether'`;
        // let records2: any = await Helpers.RedisHelper.getString('currencyData');
        // records2 = JSON.parse(records2);
        // console.log(records2);
        var result2: any = await TransactionHelper.getEUR("USD");
        console.log("result", result2);
        const contract: any = await this.callContract();
        contract
          .totalIncome()
          .call()
          .then(async (result: any) => {
            let r: any = await this.convertFromSun(result);
            r = parseFloat(r);
            console.log(r, "total");
            if (r > 0) {
              resolve({
                singletrx: parseFloat(result2.price.toFixed(2).toString()),
                ether: r,
                rub: parseFloat(r.toFixed(2).toString()),
                usd: parseFloat(r.toFixed(2).toString()),
                eur: parseFloat(r.toFixed(2).toString()),
              });
            } else {
              resolve({ ether: 0, eur: 0, usd: 0, rub: 0 });
            }
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
  /**
   * Tron address conversion functions
   *
   */

  public async convertAddressToHex(address: string) {
    if (address.indexOf("41") === 0) {
      return address;
    }
    return await this.tronWeb.address.toHex(address);
  }

  private async convertAddressFromHex(address: string) {
    if (address.indexOf("41") === 0) {
      return this.tronWeb.address.fromHex(address);
    }
    return address;
  }

  public async updateEUR() {
    return new Promise(async (resolve, reject) => {
      try {
        const ResultArr: any = ["USD", "EUR", "RUB"].map(
          async (currency: any) => {
            const r: any = await TransactionHelper.getEUR(currency);
            return r;
          }
        );
        let result: any = await Promise.all(ResultArr);
        const currencyData = {
          usd: result[0].price.toFixed(3),
          eur: result[1].price.toFixed(3),
          rub: result[2].price.toFixed(3),
        };

        Helpers.RedisHelper.setString(
          "currencyData",
          JSON.stringify(currencyData)
        );

        if (1) {
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (error) {
        resolve(error);
      }
    });
  }

  public async getEUR() {
    return new Promise(async (resolve, reject) => {
      try {
        // const query = `SELECT eur FROM currencyData WHERE currency='ether'`;
        // const records: any = await this.callQuerys(query);

        let records: any = await Helpers.RedisHelper.getString("currencyData");
        records = JSON.parse(records);

        if (records) {
          const eur = records.eur;
          const usd = records.usd;
          const rub = records.rub;
          resolve(records);
        } else {
          resolve(0);
        }
      } catch (error) {
        resolve(error);
      }
    });
  }

  private async convertFromSun(value: string) {
    return new Promise(async (resolve, reject) => {
      try {
        // const this.tronWeb = new Web3('http://52.52.96.207:8545');
        const result = await this.tronWeb.fromSun(value.toString());
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  public async idToAddress(id: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const contract: any = await this.callContract();
        contract
          .idToAddress(id)
          .call()
          .then((result: any) => {
            console.log("Result", result);
            resolve(result);
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  public async idToAddressSocket(id: string) {
    // let registrationLog: any = await Helpers.RedisHelper.getString('Registration');
    // registrationLog = JSON.parse(registrationLog);

    return new Promise(async (resolve, reject) => {
      try {
        // const result = await registrationLog.filter((d: any) => d.userId === id);
        let result: any = await Registration.findOne({ userId: id });
        if (result) {
          resolve(result.user);
        } else {
          resolve("0x0000000000000000000000000000000000000000");
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  //get users details
  public async getUsers(address: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const contract: any = await this.callContract();
        contract
          .users(address)
          .call()
          .then(async (result: any) => {
            const user = {
              id: result.id.toString(),
              totalIncome: result.totalIncome.toString(),
              referrer: result?.referralAddress?.replace("41", "0x"),
              address: await this.convertAddressFromHex(address),
              reinvestCount: result?.reinvestCount?.toString(),
            };
            // console.log('users', result, JSON.stringify(result));

            resolve(user);
          })
          .catch((err: any) => {
            console.log(err.message, "first user");
            if (err.message === "Request failed with status code 503") {
              contract
                .users(address)
                .call()
                .then(async (result: any) => {
                  const user = {
                    id: result.id.toString(),
                    totalIncome: result?.totalIncome?.toString(),
                    referrer: result?.referralAddress,
                    address: await this.convertAddressFromHex(address),
                    reinvestCount: result?.reinvestCount?.toString(),
                  };
                  // console.log('users', result, JSON.stringify(result));

                  resolve(user);
                })
                .catch((err: any) => {
                  console.log(err.message, "second user");
                  if (err.message === "Request failed with status code 503") {
                    contract
                      .users(address)
                      .call()
                      .then(async (result: any) => {
                        const user = {
                          id: result.id.toString(),
                          totalIncome: result.totalIncome.toString(),
                          referrer: result.referralAddress,
                          address: await this.convertAddressFromHex(address),
                          reinvestCount: result.reinvestCount.toString(),
                        };
                        // console.log('users', result, JSON.stringify(result));

                        resolve(user);
                      })
                      .catch((err: any) => {
                        console.log(err.message, "third user");
                      });
                  }
                });
            }
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  // public async getAllRegistrationLogs(): Promise<any> {
  //   let startTime = new Date().getTime();
  //   let midTime = new Date(
  //     new Date().setTime(startTime + 12 * 60 * 60 * 1000)
  //   ).getTime();
  //   let endTime = new Date(
  //     new Date().setTime(midTime + 12 * 60 * 60 * 1000)
  //   ).getTime();

  //   return await ReInvestment.aggregate([
  //     {
  //       $match: {
  //         reinvestCount: "1",
  //         timestamp: { $gt: startTime, $lte: midTime },
  //         referrer: { $ne: "0x0000000000000000000000000000000000000000" },
  //       },
  //     },
  //     {
  //       $group: {
  //         _id: {
  //           referrer: "$referrer",
  //         },
  //         total: { $sum: { $add: { $toLong: "$investment" } } },
  //         count: { $sum: 1 },
  //       },
  //     },
  //     { $sort: { total: -1 } },
  //     { $limit: 10 },
  //   ]);
  // }

  public getRefDirects(address: string) {
    return new Promise(async (resolve, reject) => {
      try {
        address = await this.convertAddressToHex(address);
        address = address.replace("41", "0x");

        const allReg = await Registration.countDocuments();
        const allRegRef = await Registration.countDocuments({
          referrer: address,
        });

        resolve({ allReg, allRegRef });
      } catch (err) {
        reject(err);
      }
    });
  }
  /**
   * tree array
   * @param  {string} address
   * @param  {string} level
   * @returns Promise
   */
  public async getNewUserPlacedArr(
    address: string,
    level: string
  ): Promise<any> {
    try {
      address = await this.convertAddressToHex(address);
      // console.log(address.indexOf('41'))
      if (address.indexOf("41") === 0) {
        address = address.replace("41", "0x");
      }
      const limit = 3 ** parseInt(level);
      const query = [
        {
          $match: { currentReferrer: address, level },
        },
        { $limit: limit },
        { $sort: { place: 1, timestamp: 1 } },
        {
          $lookup: {
            from: "registrations",
            localField: "user",
            foreignField: "referrer",
            as: "directs",
          },
        },
        {
          $project: {
            _id: 1,
            level: 1,
            referrerAddress: 1,
            currentReferrer: 1,
            place: 1,
            user: 1,
            directs: { $size: "$directs" },
          },
        },
      ];
      return await NewUserPlaced.aggregate(query);
    } catch (err) {
      return err;
    }
  }
  /** get direct referrals
   * @param  {string} address
   * @returns Promise
   */
  public async getDirctCounts(address: string): Promise<number> {
    address = await this.convertAddressToHex(address);
    address = address.replace("41", "0x");
    return await Registration.countDocuments({ referrer: address });
  }
  /**
   * get Matrix Filled
   * @param  {string} address
   * @returns Promise
   */
  public async getMatrixFilled(address: string): Promise<any> {
    try {
      address = await this.convertAddressToHex(address);
      address = address.replace("41", "0x");
      const query = [
        { $match: { currentReferrer: address } },
        { $group: { _id: "$level", count: { $sum: 1 } } },
      ];

      return await NewUserPlaced.aggregate(query);
    } catch (err) {
      return err;
    }
  }
  /**
   * get Matrix Filled
   * @param  {string} address
   * @returns Promise
   */
  public async getTeam(address: string): Promise<any> {
    try {
      address = await this.convertAddressToHex(address);
      address = address.replace("41", "0x");

      return await NewUserPlaced.countDocuments({ currentReferrer: address });
    } catch (err) {
      return err;
    }
  }

  public async register(data: any) {
    return new Promise(async (resolve, reject) => {
      try {
        var result: any = await Registration.insertMany(data);
        var results: any = await Registration.find({});
        console.log("results", results);
        resolve({ status: true });
      } catch (error) {
        resolve(error);
      }
    });
  }
  public async directReferralUsers(referrerAddress: any) {
    return new Promise(async (resolve, reject) => {
      try {
        referrerAddress = referrerAddress.replace("41", "0x");
        //console.log(referrerAddress,'=============referrerAddress')
        var results: any = await Registration.countDocuments({
          referrerAddress,
        });
        // console.log(results,'=============results')
        resolve(results);
      } catch (error) {
        reject(error);
      }
    });
  }
  public async getReferrals(address: any) {
    try {
      const contract: any = await this.callContract();

      address = await this.convertAddressToHex(address);
      address = address.replace("41", "0x");
      console.log("address", address);
      const response = await contract.investmentValues().call();
      let arrayInstring: any = [];
      for (let i = 0; i < response.length; i++) {
        arrayInstring.push(Number(response[i].toString()));
      }
      // let obj = [
      //   {
      //     level: "1",
      //     referrals: "0",
      //     totalPartners: 3,
      //     funds: 1000,
      //     potentialIncome: 3000,
      //     received: "0",
      //     reward: "0",
      //   },
      //   {
      //     level: "2",
      //     referrals: "0",
      //     totalPartners: 9,
      //     funds: 2000,
      //     potentialIncome: 18000,
      //     received: "0",
      //     reward: "0",
      //   },
      //   {
      //     level: "3",
      //     referrals: "0",
      //     totalPartners: 27,
      //     funds: 8000,
      //     potentialIncome: 216000,
      //     received: "0",
      //     reward: "0",
      //   },
      //   {
      //     level: "4",
      //     referrals: "0",
      //     totalPartners: 81,
      //     funds: 32000,
      //     potentialIncome: 2592000,
      //     received: "0",
      //     reward: "0",
      //   },
      // ];
      const obj: any = [];
      for (let j = 0; j < arrayInstring.length; j++) {
        let newObj: any = {};
        newObj.level = (j + 1).toString();
        newObj.referrals = "0";
        newObj.totalPartners = 3 ** (j + 1);
        newObj.funds = arrayInstring[j] / 1000000;
        newObj.potentialIncome = newObj.totalPartners * newObj.funds;
        newObj.received = "0";
        newObj.reward = "0";
        obj.push(newObj);
      }

      let mainMatch = {
        $match: { referrerAddress: address },
      };
      let mainGroup = {
        $group: {
          _id: "$level",
          level: { $push: "$$ROOT" },
          count: { $sum: 1 },
        },
      };
      let newUserPlaceCount: any = await NewUserPlaced.aggregate([
        mainMatch,
        mainGroup,
      ]);
      let userIncome: any = await UserIncome.aggregate([mainMatch]);
      let rewardIncome: any = await MissedIncome.aggregate([mainMatch]);
      //console.log(userIncome,'============userIncome');
      for (let element of obj) {
        let totalUserIncome = 0,
          totalrewardIncome = 0;
        for (let innerElement of newUserPlaceCount) {
          if (innerElement._id === element.level) {
            element.level = innerElement._id;
            element.referrals = innerElement.count;
          }
        }
        for (let innerElement of userIncome) {
          if (innerElement.level === element.level) {
            totalUserIncome += parseInt(innerElement.income);
          }
        }
        for (let innerElement of rewardIncome) {
          if (innerElement.level === element.level) {
            totalrewardIncome += parseInt(innerElement.income);
          }
        }
        let res: any = await this.convertFromSun(totalUserIncome.toString());
        element.received = res;
        res = await this.convertFromSun(totalrewardIncome.toString());
        element.reward = res;
      }
      return obj;
    } catch (error) {
      throw error;
    }
  }

  public async getNewUserPlaced(
    referrerAddress: string,
    level: string
  ): Promise<any> {
    referrerAddress = await this.convertAddressToHex(referrerAddress);
    referrerAddress = referrerAddress.replace("41", "0x");
    let addressArray = [],
      finalArray = [];
    let newUserPlace: any = await NewUserPlaced.find({
      referrerAddress,
      level,
    });
    for (let element of newUserPlace) {
      let data: any = {};
      data.userAddress = element.userAddress;
      data.place = element.place;
      data.level = element.level;
      data.userId = "0";
      data.currentLevelBuyed = "0";
      addressArray.push(element.userAddress);
      finalArray.push(data);
    }
    let mainSort = {
      $sort: { timestamp: -1 },
    };
    let mainMatch = {
      $match: { userAddress: { $in: addressArray } },
    };

    let mainGroup = {
      $group: {
        _id: "$userAddress",
        lastLevelPurchased: { $first: { _id: "$_id", level: "$level" } },
      },
    };

    let queryResult: any = await Promise.all([
      Registration.find(
        { userAddress: { $in: addressArray } },
        { userId: 1, userAddress: 1 },
        {}
      ),
      LevelPurchased.aggregate([mainSort, mainMatch, mainGroup]),
    ]);
    let users: any = queryResult[0];
    let lastLevelPurchased: any = queryResult[1];
    for (let element of finalArray) {
      for (let innerElement of users) {
        if (element.userAddress === innerElement.userAddress) {
          element.userId = innerElement.userId;
        }
      }
      for (let innerElement of lastLevelPurchased) {
        if (element.userAddress === innerElement._id) {
          element.currentLevelBuyed = innerElement.lastLevelPurchased.level;
        }
      }
    }
    return finalArray;
  }
}

export default new Transaction();
