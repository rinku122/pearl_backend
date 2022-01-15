import BaseModel from '../../../model/base.model';
const TronWeb = require('tronweb');
import Transaction from '../transaction.model';

class SponserDailyPool extends BaseModel {
    public TRONGRID_API = process.env.TRONGRID_API!;
    public tronWeb: any;
    public myContractOb: any;
    public myContractTokenOb: any;
    public contractAddress = process.env.CONTRACT_ADDRESS;
    public contractAddressToken = process.env.CONTRACT_ADDRESS_TOKEN;
    public DEFAULT_ADDRESS = process.env.DEFAULT_ADDRESS!;
    public BLOCK_NUMBER = process.env.BLOCK_NUMBER!;
    public levelIncomeArr = [0, 1, 2, 3, 4];

    constructor() {
        super();
        this.tronWeb = new TronWeb({
            fullNode: this.TRONGRID_API,
            solidityNode: this.TRONGRID_API,
            eventServer: this.TRONGRID_API,
        },
            // '5812d684a54522d5203a8b887756fd4b2194731f7fdabbe996faae4b89bf4a8a'
            'f841108d7816d60e56cc7f223e3b1fff565c3f5af4b2dcc91ab2be3658ba8f27' // ajeet sir
        );
    }

    //calling the contract
    private async callContract() {
        return new Promise((resolve, reject) => {
            if (this.myContractOb) {
                resolve(this.myContractOb);
            } else {
                this.tronWeb.contract().at(this.contractAddress)
                .then((contract: any) => {
                    this.myContractOb = contract;

                    resolve(this.myContractOb);
                }).catch((err: any) => {
                    if (err.message === 'Request failed with status code 503') {
                        this.tronWeb.contract().at(this.contractAddress).then(resolve).catch(reject);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    }

    //get level price 
    public callDailyPool() {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(true);
                // let topSponsors: any = await Transaction.getAllRegistrationLogs();
                // let topSponsorsAddressArr = topSponsors.map((d: any) => {
                //     return d['_id']['referrer'];
                // });


                // let totalDailyAmount = topSponsors.reduce((a: any, b: any) => a + parseInt(b.total) , 0);
                // totalDailyAmount = totalDailyAmount.toString();
                // console.log(topSponsorsAddressArr, totalDailyAmount);

                // const feeLimit = 1000000000;
                // const contract: any = await this.callContract();

                // if (topSponsorsAddressArr.length > 0) {
                //      contract.DailyTopSponserPool(topSponsorsAddressArr, totalDailyAmount)
                //     .send({ feeLimit, shouldPollResponse: true })
                //     .then((result: any) => {
                //         console.log('Success Daily Pool', result);
                //         // const r = await this.convertFromSun(result);
                //         resolve(true);
                //     }).catch((err: any) => {
                //         console.log(err);
                //         if (err.message === 'Request failed with status code 503') {
                //             contract.DailyTopSponserPool(topSponsorsAddressArr, totalDailyAmount)
                //                 .send({ feeLimit, shouldPollResponse: true })
                //                 .then((result: any) => {
                //                     // const r = await this.convertFromSun(result);
                //                     resolve(true);
                //                 }).catch((err: any) => {
                //                     console.log(err);
                //                     reject(err);
                //                 });
                //         } else {
                //             reject(err);
                //         }
                //     });
                // }
            } catch (error) { reject(error); }
        });
    }

}

export default new SponserDailyPool();