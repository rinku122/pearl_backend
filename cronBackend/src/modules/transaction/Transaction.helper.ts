import rp from 'request-promise';

class TransactionHelper {
    public async getLogs() {
        return new Promise((resolve, reject) => {
            const requestOptions = {
                method: 'GET',
                uri: 'https://api.shasta.trongrid.io/event/contract/TAPD3HNeiBGj8Sq6oKeE3qZxaTD2kQQPf6',
                qs: {
                    'block_number': '11409929',
                },
                json: true,
                gzip: true
            };

            rp(requestOptions).then(response => {
                console.log('API call response:', response);
                resolve(response);
            }).catch((err) => {
                // console.log('API call error:', err.message);
                reject(err);
            });
        });
    }

}

export default new TransactionHelper();