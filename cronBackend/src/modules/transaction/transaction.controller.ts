import { Request, Response, Router } from "express";

import * as Interfaces from "interfaces";
import { Responses } from "../../helpers";
import { requestDecrypt } from "../../middlewares";

import Transaction from "./transaction.model";


class TransactionController implements Interfaces.Controller {
    public path = '/Transaction';
    public router = Router();
    constructor() {
        this.initializeRoutes();
    }

    private async initializeRoutes() {
        this.router
            .all(`${this.path}/*`);
    }
}

export default TransactionController;