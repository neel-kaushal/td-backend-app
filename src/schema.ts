import { makeExecutableSchema } from '@graphql-tools/schema'
import axios from 'axios'
import * as dotenv from 'dotenv'
const queryString = require('query-string');

const apiKey = process.env.API_KEY;
let bearerToken = process.env.BEARER_TOKEN;

const typeDefs = `
type Query {
  stocks(symbols: [String]): [Stock]
}

type Stock {
  symbol: String
  description: String
  currentPrice: Float
  openPrice: Float
  highPrice: Float
  lowPrice: Float
  PE: Float
  exchange: String
}
`
dotenv.config()

const resolvers = {
  Query: {
    stocks: async (_obj, args, _context, _info) => {
        const symbol = args.symbols
        const response = await retrieveStockQuotes(symbol.join())
        const data = response.data

        let tickers = []

        Object.keys(data).forEach(key => {
            const stockInfo = data[key]
            tickers.push({
              symbol: stockInfo.symbol,
              description: stockInfo.description,
              currentPrice: stockInfo.lastPrice,
              openPrice: stockInfo.openPrice,
              highPrice: stockInfo.highPrice,
              lowPrice: stockInfo.lowPrice,
              PE: stockInfo.peRatio,
              exchange: stockInfo.exchangeName
            })
        })
        return tickers
        
    }
}
}

export const schema = makeExecutableSchema({
  resolvers,
  typeDefs,
})

let config = {
  headers: { Authorization: `Bearer ${bearerToken}` }
};

function setConfig(updatedBearerToken: string) {
  config = {
    headers: { Authorization: `Bearer ${updatedBearerToken}` }
  }
  return
}

async function retrieveStockQuotes(symbols: string) {
  try {
    return await axios.get("https://api.tdameritrade.com/v1/marketdata/quotes?api_key=" +
    apiKey + "&symbol=" + symbols, config);
  } catch (error) {

    if(error.response.status === 401) {
      console.log('The bearer token has expired. Generating a new bearer token...')

      const regeneratedBearer = await axios({
        method: 'post',
        url: 'https://api.tdameritrade.com/v1/oauth2/token',
        data: queryString.stringify({
            grant_type: 'refresh_token',
            refresh_token: process.env.REFRESH_TOKEN,
            client_id: process.env.API_KEY
        }),
        headers: {
          'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
        }
      })

      setConfig(regeneratedBearer.data.access_token)
  
      return await axios.get("https://api.tdameritrade.com/v1/marketdata/quotes?api_key=" +
      apiKey + "&symbol=" + symbols, config);

    }

    return error.response
  }
}
