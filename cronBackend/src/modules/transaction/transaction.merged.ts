import e from "express";
// import * as SqlString from "sqlstring";
import BaseModel from "../../model/base.model";

import TransactionSchema from "./transaction.schema.model";

const TronWeb = require("tronweb");

class TransactionMerged extends BaseModel {
  public TRONGRID_API = process.env.TRONGRID_API!;
  public tronWeb: any;
  public myContractOb: any;
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
      }
      // '7A391C88137C9D7F5B8CA7E61ABC1F7E7B389B4280A2B28ABA7EDB336AC10298'
    );
  }
  public async getRegistrationLogs() {
    try {
      let transactionHashArray: any = [];
      let distinctRegTransactionHash: any = await TransactionSchema[
        "Registration"
      ].find({ islogUpdated: false }, { transactionHash: 1 }, { limit: 20 });
      for (let element of distinctRegTransactionHash) {
        transactionHashArray.push(element.transactionHash);
        await this.getLogsTransactionHash(element.transactionHash);
      }
      if (transactionHashArray.length > 0) {
        await TransactionSchema["Registration"].updateMany(
          { transactionHash: { $in: transactionHashArray } },
          { $set: { islogUpdated: true } },
          {}
        );
      }
      return true;
    } catch (error) {
      //console.log("addNewUserLogMongo============error",error);
      throw error;
    }
  }

  public async getLevelPurchasedLogs() {
    try {
      let transactionHashArray: any = [];
      let criteria: any = {
        islogUpdated: false,
        selfIspurchased: { $ne: "false" },
      };
      let options: any = { skip: 0, limit: 10 };
      let distinctRegTransactionHash: any = await TransactionSchema[
        "LevelPurchased"
      ].find(criteria, { transactionHash: 1 }, options);
      //console.log(distinctRegTransactionHash,'==============distinctRegTransactionHash')
      for (let element of distinctRegTransactionHash) {
        transactionHashArray.push(element.transactionHash);
        await this.getLogsTransactionHash(element.transactionHash);
      }
      if (transactionHashArray.length > 0) {
        await TransactionSchema["LevelPurchased"].updateMany(
          { transactionHash: { $in: transactionHashArray } },
          { $set: { islogUpdated: true } },
          {}
        );
      }
      return true;
    } catch (error) {
      //console.log("addNewUserLogMongo============error",error);
      throw error;
    }
  }

  private async getLogsTransactionHash(transactionHash: string) {
    let allCollectionFinalData: any = [];
    try {
      let eventslogs: any = await this.tronWeb.getEventByTransactionID(
        transactionHash
      );
      eventslogs = JSON.parse(JSON.stringify(eventslogs));
      let dataSetArray: any = await this.createDataForAllCollection(eventslogs);
      allCollectionFinalData = dataSetArray.allCollectionFinalData || [];
      await this.insertInAllCollection(allCollectionFinalData);
      return true;
    } catch (error) {
      //console.log("addNewUserLogMongo============error=======88",error);
      throw error;
    }
  }
  private async createDataForAllCollection(eventslogs: any) {
    let newUserPlaced: any[] = [],
      userIncome: any[] = [],
      missedIncome: any[] = [];
    let finalArray: any = [];
    try {
      for (let element of eventslogs) {
        let tempData: any = {};

        tempData.block = element.block;
        tempData.timestamp = element.timestamp;
        tempData.event = element.name;
        tempData.fingerprint = element.fingerprint;
        tempData.transactionHash = element.transaction;

        switch (element.name) {
          case "NewUserPlaced":
            tempData.referrerAddress = element.result.referrerAddress;
            tempData.place = element.result.place;
            tempData.level = element.result.level;
            tempData.parent = element.result.parent;
            tempData.userAddress = element.result.userAddress;
            newUserPlaced.push(tempData);
            break;

          case "UserIncome":
            tempData.referrerAddress = element.result.referrerAddress;
            tempData.level = element.result.level;
            tempData.income = element.result.income;
            tempData.userAddress = element.result.userAddress;
            userIncome.push(tempData);
            break;

          case "MissedIncome":
            tempData.referrerAddress = element.result.referrerAddress;
            tempData.level = element.result.level;
            tempData.income = element.result.income;
            tempData.userAddress = element.result.userAddress;
            missedIncome.push(tempData);
            break;
        }
      }

      // finalArray.push({ eventName: 'Registration', data: registrations })
      finalArray.push({ eventName: "NewUserPlaced", data: newUserPlaced });
      finalArray.push({ eventName: "UserIncome", data: userIncome });
      finalArray.push({ eventName: "MissedIncome", data: missedIncome });

      return { allCollectionFinalData: finalArray };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  private async insertInAllCollection(finalArray: any) {
    try {
      for (let element of finalArray) {
        console.log(element.eventName, element.data.length);
        if (element.data.length > 0) {
          console.log(element.eventName);
          await TransactionSchema[element.eventName].insertMany(element.data);
          if(element.eventName === 'NewUserPlaced'|| element.eventName === 'MissedIncome' || element.eventName === 'UserIncome'){
          await this.callingDelete1(element.eventName);
          }
        }
      }
      return true;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  private async callingDelete1(d: string) {
    console.log('===========Inside calling delete============')
    let query: any = [];
    switch (d) {
      case "NewUserPlaced":
        query = [
          {
            $group: {
              _id: {
                transactionHash: "$transactionHash",
                level: "$level",
                place: "$place",
                userAddress: "$userAddress",
                referrerAddress: "$referrerAddress",
              },
              dups: { $addToSet: "$_id" },
              count: { $sum: 1 },
            },
          },
          { $match: { count: { $gt: 1 } } },
        ];
        break;
      case "UserIncome":
        query = [
          {
            $group: {
              _id: {
                transactionHash: "$transactionHash",
                level: "$level",
                userAddress: "$userAddress",
                referrerAddress: "$referrerAddress",
              },
              dups: { $addToSet: "$_id" },
              count: { $sum: 1 },
            },
          },
          { $match: { count: { $gt: 1 } } },
        ];
        break;
      case "MissedIncome":
        query = [
          {
            $group: {
              _id: {
                transactionHash: "$transactionHash",
                level: "$level",
                userAddress: "$userAddress",
                referrerAddress: "$referrerAddress",
              },
              dups: { $addToSet: "$_id" },
              count: { $sum: 1 },
            },
          },
          { $match: { count: { $gt: 1 } } },
        ];
        break;
    }
    try {
      let removedDuplicateDocument: any = [];
      if (query.length > 0) {
        let getDuplicate: any = await TransactionSchema[d].aggregate(query).allowDiskUse(true);
        if (getDuplicate.length > 0) {
          getDuplicate.forEach((doc: any) => {
            doc.dups.shift();
            let afterDups: any = doc.dups;
            afterDups.forEach((innerElement: any) => {
              removedDuplicateDocument.push(innerElement);
            });
          });
        }
        console.log(removedDuplicateDocument.length,'==============removedDuplicateDocument')
        if (removedDuplicateDocument.length > 0) {
          console.log('=================ifDelete=====================')
          await TransactionSchema[d].deleteMany({
            _id: { $in: removedDuplicateDocument },
          });
        } 
        //console.log("\n\n\n==============removedDuplicateDocumentr", removedDuplicateDocument.length, "Type====", d, "\n\n\n");
      }
    } catch (err) {
      console.log(err, "++++++++++++++++++++++++=test");
    }
  }
}

export default new TransactionMerged();
