import { makeExecutableSchema } from '@graphql-tools/schema'
import axios from 'axios'
import * as dotenv from 'dotenv'
import * as cron from 'node-cron'
const queryString = require('query-string');

dotenv.config()

let config
setup()

async function setup() {
  const bearerToken = await generateBearer();
  setConfig(bearerToken)
}

cron.schedule('28 * * * *', async () => {
  const bearerToken = await generateBearer();
  setConfig(bearerToken)
},true).start();

async function generateBearer() {
  const bearerResponse = await axios({
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

  return bearerResponse.data.access_token

}

function setConfig(updatedBearerToken: string) {

  config = {
    headers: { Authorization: `Bearer ${updatedBearerToken}` }
  }
  return
}

const apiKey = process.env.API_KEY;

const typeDefs = `
type Query {
  stock(symbol: String): Stock
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
    stock: async (_obj, args, _context, _info) => {
        const symbol = args.symbol

        const response = await retrieveStockQuote(symbol)

        let stockQuote = {}
        
        Object.keys(response.data).forEach(key => {
          const stockInfo = response.data[key]
          stockQuote = {
              symbol: stockInfo.symbol,
              description: stockInfo.description,
              currentPrice: stockInfo.lastPrice,
              openPrice: stockInfo.openPrice,
              highPrice: stockInfo.highPrice,
              lowPrice: stockInfo.lowPrice,
              PE: stockInfo.peRatio,
              exchange: stockInfo.exchangeName
          }
        }
      )

      return stockQuote
}

}
}

export const schema = makeExecutableSchema({
  resolvers,
  typeDefs,
})

async function retrieveStockQuote(symbol: string) {
  try {
    return await axios.get("https://api.tdameritrade.com/v1/marketdata/" + symbol +  "/quotes?api_key=" +
    apiKey, config);
  } catch (error) {

    if(error.response.status === 401) {
      console.log('The bearer token has expired. Generating a new bearer token...')
    }

    return error.response
  }
}
