import rp from "request-promise";

class TransactionHelper {
  public async getEUR(currency: any) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        method: "GET",
        uri: "https://api.coingecko.com/api/v3/coins/markets",
        qs: {
          vs_currency: currency,
          ids: "tether",
          order: "market_cap_desc",
          per_page: "1",
          page: "1",
          sparkline: "false",
        },
        // headers: {
        //     'X-CMC_PRO_API_KEY': api_key
        // },
        json: true,
        gzip: true,
      };

      rp(requestOptions)
        .then((response) => {
          // console.log('API call response1:', response);
          const { current_price } = response[0];
          // const { quote: { USD } } = TRX;
          // console.log('API call response:', current_price);
          resolve({ price: current_price, currency: currency });
        })
        .catch((err) => {
          // console.log('API call error:', err.message);
          reject(err);
        });
    });
  }
}

export default new TransactionHelper();
