// import * as SqlString from "sqlstring";
import BaseModel from "../../model/base.model";

import TransactionSchema from "./transaction.schema.model";

const TronWeb = require("tronweb");

class Transaction extends BaseModel {
  public TRONGRID_API = process.env.TRONGRID_API!;
  public tronWeb: any;
  public myContractOb: any;
  public contractAddress = process.env.CONTRACT_ADDRESS;
  public DEFAULT_ADDRESS = process.env.DEFAULT_ADDRESS!;
  public BLOCK_NUMBER = process.env.BLOCK_NUMBER!;

  private eventsArr = ["Registration", "LevelPurchased"];

  constructor() {
    super();
    this.tronWeb = new TronWeb(
      {
        fullNode: this.TRONGRID_API,
        solidityNode: this.TRONGRID_API,
        eventServer: this.TRONGRID_API,
      }
      // '7A391C88137C9D7F5B8CA7E61ABC1F7E7B389B4280A2B28ABA7EDB336AC10298'
    );
  }

  public async addNewUserLogRedis() {
    try {
      console.log("--run log direct from the app--");
      this.eventsArr.map(async (d) => {
        let logs: any = await this.getData(d);
        if (logs) {
          let event = await this.appendLogs(logs, d);
          if (event) {
            console.log(event.length, d, "further logs");
            if (event[0] && event[0].check) {
              console.log(`${d}`, event.length);
              this.insertInAllCollection(d, event);
            }
          }
        } else {
          let event = await this.getCronLogs(
            "",
            [],
            d,
            parseInt(this.BLOCK_NUMBER)
          );
          if (event) {
            if (event[0] && event[0].check) {
              console.log(`${d}`, event.length, "not found");
              await this.insertInAllCollection(d, event);
            }
          }
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  //calling the contract
  private async callContract() {
    return new Promise((resolve, reject) => {
      if (this.myContractOb) {
        console.log(this.myContractOb);
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

  // recurresive call function
  public async getCronLogs(
    fingerprint: string,
    n: any,
    eventName: string,
    blockNumber: number
  ): Promise<any> {
    try {
      let event = await this.tronWeb.getEventResult(this.contractAddress, {
        eventName,
        fromBlock: blockNumber,
        size: 1,
        fingerprint,
        sort: "block_timestamp",
      });
      // console.log(event,'============event');
      if (event.length > 0) {
        // console.log(event[event.length - 1], 'last');
        // event = await this.sortDataAsc(event, 'timestamp');
        const lastRecord: any = event[event.length - 1];

        let r = await event.map(async (d: any) => {
          const returnValues: any = d.result;
          //check for events
          returnValues.check = false;
          if (d.result && d.result[0]) {
            returnValues.check = true;
          }
          returnValues.transactionHash = d.transaction;
          returnValues.timestamp = d.timestamp;
          returnValues.event = d.name;
          returnValues.block = d.block;
          returnValues.fingerprint = lastRecord.fingerprint
            ? lastRecord.fingerprint
            : "";

          return returnValues;
        });
        r = await Promise.all(r);
        if (!lastRecord.fingerprint) {
          //recurrsive
          return n;
        }
        if (n.length >= 1) {
          //taras concept
          return n;
        } else {
          console.log(r.length, eventName, "in recurrsive call 2 for mongo");
          n = n.concat(r);
          return await this.getCronLogs(
            lastRecord.fingerprint,
            n,
            eventName,
            blockNumber
          );
        }
      } else {
        return n;
      }
    } catch (error) {
      console.log(error);
    }
  }

  // recurresive call function
  public async getLogsTimeStamp(
    fingerprint: string,
    n: any,
    eventName: string,
    sinceTimestamp: number,
    newCount: number
  ): Promise<any> {
    try {
      let event = await this.tronWeb.getEventResult(this.contractAddress, {
        eventName,
        sinceTimestamp,
        size: 200,
        fingerprint,
        sort: "block_timestamp",
      });
      if (event.length > 0) {
        // console.log(event, 'last');
        // event = await this.sortDataAsc(event, 'timestamp');
        const lastRecord: any = event[event.length - 1];

        if (event.length === 1) {
          return n;
        }
        if (newCount === 0) {
          event.splice(0, 1);
        }
        newCount += event.length;
        // console.log(newCount, '==========new count=====', eventName);
        let r = await event.map(async (d: any) => {
          const returnValues: any = d.result;
          //check for events
          returnValues.check = false;
          if (d.result && d.result[0]) {
            returnValues.check = true;
          }
          returnValues.transactionHash = d.transaction;
          returnValues.timestamp = d.timestamp;
          returnValues.event = d.name;
          returnValues.block = d.block;
          returnValues.fingerprint = lastRecord.fingerprint
            ? lastRecord.fingerprint
            : "";

          return returnValues;
        });
        r = await Promise.all(r);
        if (!lastRecord.fingerprint) {
          //recurrsive
          n = n.concat(r);
          return n;
        }
        if (newCount >= 200) {
          //taras concept
          n = n.concat(r);
          return n;
        } else {
          console.log(r.length, eventName, "in recurrsive call 4 for redis");
          n = n.concat(r);
          return await this.getLogsTimeStamp(
            lastRecord.fingerprint,
            n,
            eventName,
            sinceTimestamp,
            newCount
          );
        }
      } else {
        return n;
      }
    } catch (error) {
      console.log(error);
    }
  }

  // recurresive call function
  public async appendLogs(oldLog: any, eventName: string): Promise<any> {
    try {
      return await this.getLogsTimeStamp(
        "",
        [],
        eventName,
        oldLog.timestamp,
        0
      );
    } catch (error) {
      console.log(error);
    }
  }

  public async eventWatch() {
    console.log("--run watch  watch function from the app--");
    try {
      const contract: any = await this.callContract();
      this.eventsArr.map(async (d) => {
        contract[d]().watch(async (err: any, d: any) => {
          console.log(`${d} watch event`);
          if (err) {
            return console.error('Error with "method" event:', err);
          }
          //updating redis
          // this.addNewUserLogRedis();
        });
      });
    } catch (error) {
      console.log(error);
    }
  }

  private async insertInAllCollection(eventName: string, data: any) {
    try {
      if (eventName == "Registration" || eventName == "LevelPurchased") {
        const finalDataToUpload = await this.uniqArr(data, eventName);
        await TransactionSchema[eventName].insertMany(finalDataToUpload);
        await this.callingDelete(eventName);
      }
      return true;
    } catch (error) {
      throw error;
    }
  }

  private async getData(d: string) {
    return new Promise((resolve, reject) => {
      TransactionSchema[d]
        .findOne()
        .sort({ timestamp: -1 })
        .then(resolve)
        .catch(reject);
    });
  }

  private async uniqArr(arr: any = [], d: string) {
    let newArray: any = [];
    arr.forEach(function (item: any) {
      if (newArray.length !== 0) {
        const _isPresent = newArray.find((secItem: any) => {
          if (d === "Registration") {
            return secItem.transactionHash === item.transactionHash;
          } else if (d === "LevelPurchased") {
            return (
              secItem.transactionHash === item.transactionHash &&
              secItem.userAddress === item.userAddress &&
              secItem.level === item.level
            );
          }
        });
        if (!_isPresent) {
          //console.log(item, d, '============item')
          newArray.push(item);
        }
      } else {
        newArray.push(item);
      }
    });

    return await newArray;
  }

  private async callingDelete(d: string) {
    let query: any = [];
    switch (d) {
      case "Registration":
        // case "LevelPurchased":
        query = [
          //{ $match: { "isDuplicate": true } },
          {
            $group: {
              _id: {
                transactionHash: "$transactionHash",
              },
              dups: { $addToSet: "$_id" },
              count: { $sum: 1 },
            },
          },
          { $match: { count: { $gt: 1 } } },
        ];
        query.length;
        break;
      case "LevelPurchased":
        // case "LevelPurchased":
        query = [
          //{ $match: { "isDuplicate": true } },
          {
            $group: {
              _id: {
                transactionHash: "$transactionHash",
                level: "$level",
                userAddress: "$userAddress",
              },
              dups: { $addToSet: "$_id" },
              count: { $sum: 1 },
            },
          },
          { $match: { count: { $gt: 1 } } },
        ];
        query.length;
        break;
    }
    let removedDuplicateDocument: any = [];
    if (query.length > 0) {
      let getDuplicate: any = await TransactionSchema[d]
        .aggregate(query)
        .allowDiskUse(true);
      if (getDuplicate.length > 0) {
        getDuplicate.forEach((doc: any) => {
          doc.dups.shift();
          let afterDups: any = doc.dups;
          afterDups.forEach((innerElement: any) => {
            removedDuplicateDocument.push(innerElement);
          });
        });
      }

      if (removedDuplicateDocument.length > 0) {
        await TransactionSchema[d].deleteMany({
          _id: { $in: removedDuplicateDocument },
        });
      }
    }
  }
}

export default new Transaction();
