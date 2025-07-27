#!/usr/bin/env node
import "dotenv/config";
import axios from "axios";
import { FastMCP } from "fastmcp";
import { z } from "zod";

// --- Environment Variable and API Key ---
// We export it to allow mocking in tests
export const finnhubClient = axios.create({
  baseURL: "https://finnhub.io/api/v1",
  // Token will be set in the main function after validation
});

// --- Constants ---
export const TROY_OUNCE_TO_GRAMS = 31.1034768;

// --- FastMCP Server Setup ---
const server = new FastMCP({
  name: "PreciousMetalPrice",
  version: "1.0.0",
});

const getPreciousMetalPriceParams = z.object({
  market: z
    .enum(["london", "new_york", "shanghai"])
    .describe("The trading market"),
  metal: z
    .enum(["gold", "silver"])
    .describe("The metal to query (gold or silver)"),
  type: z
    .enum(["futures", "spot"])
    .describe("The price type (spot or futures)"),
});

export async function getPreciousMetalPriceLogic(args: {
  market: "london" | "new_york" | "shanghai";
  metal: "gold" | "silver";
  type: "futures" | "spot";
}) {
  console.log("Executing with arguments:", args);

  try {
    // 1. Determine the symbol and currency based on market
    let symbol = "";
    let currency = "";

    switch (args.market) {
      case "london":
        // Finnhub provides limited GBP pairs for precious metals.
        // We'll get the USD price and convert using GBP/USD rate.
        symbol = args.metal === "gold" ? "OANDA:XAU_USD" : "OANDA:XAG_USD";
        currency = "GBP";
        break;
      case "new_york":
        symbol = args.metal === "gold" ? "OANDA:XAU_USD" : "OANDA:XAG_USD";
        currency = "USD";
        break;
      case "shanghai":
        // For Shanghai Gold Exchange, prices are often in CNY/gram already.
        // This requires a different symbol and conversion logic.
        // Placeholder: Using a common proxy symbol.
        symbol = "XAUCNY";
        currency = "CNY";
        break;
    }

    // 2. Fetch original price
    const priceResponse = await finnhubClient.get("/quote", {
      params: { symbol },
    });
    const originalPrice = priceResponse.data.c;

    if (typeof originalPrice !== "number" || originalPrice === 0) {
      throw new Error(`Could not fetch a valid price for symbol ${symbol}.`);
    }

    // If the market is Shanghai, we might already have CNY/gram.
    // For this example, we'll assume the provided symbol gives price in CNY/ounce
    // and still needs weight conversion.
    if (args.market === "shanghai") {
      const priceInCnyPerGram = originalPrice / TROY_OUNCE_TO_GRAMS;
      const response = {
        converted_price: {
          unit: "CNY/gram",
          value: parseFloat(priceInCnyPerGram.toFixed(2)),
        },
        exchange_rate: {
          from: currency,
          rate: 1,
          to: "CNY",
        },
        market: args.market,
        metal: args.metal,
        original_price: {
          unit: `${currency}/oz (Assumed)`,
          value: originalPrice,
        },
        timestamp: new Date().toISOString(),
        type: args.type,
      };
      return response;
    }

    // 3. Fetch exchange rate for non-Shanghai markets
    let exchangeRate = 1;
    const exchangeSymbol = `${currency}/CNY`;
    const rateResponse = await finnhubClient.get("/quote", {
      params: { symbol: `OANDA:${currency}_CNY` },
    });
    exchangeRate = rateResponse.data.c;

    if (typeof exchangeRate !== "number" || exchangeRate === 0) {
      throw new Error(
        `Could not fetch a valid exchange rate for ${exchangeSymbol}.`
      );
    }

    // 4. Perform conversions
    const priceInCnyPerOunce = originalPrice * exchangeRate;
    const priceInCnyPerGram = priceInCnyPerOunce / TROY_OUNCE_TO_GRAMS;

    const response = {
      converted_price: {
        unit: "CNY/gram",
        value: parseFloat(priceInCnyPerGram.toFixed(2)),
      },
      exchange_rate: {
        from: currency,
        rate: exchangeRate,
        to: "CNY",
      },
      market: args.market,
      metal: args.metal,
      original_price: {
        unit: `${currency}/oz`,
        value: originalPrice,
      },
      timestamp: new Date().toISOString(),
      type: args.type,
    };

    return response;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Error executing tool logic:", error);
    // Re-throw the error to be caught by the calling function in tests
    throw new Error(errorMessage);
  }
}

server.addTool({
  description:
    "Queries spot and futures prices for gold and silver from specified markets (New York, London, or Shanghai), returning the value in CNY per gram.",
  execute: async (args) => {
    try {
      const result = await getPreciousMetalPriceLogic(args);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      return JSON.stringify({ error: true, message: errorMessage });
    }
  },
  name: "getPreciousMetalPrice",
  parameters: getPreciousMetalPriceParams,
});

async function main() {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    console.error("Error: FINNHUB_API_KEY environment variable not set.");
    console.error(
      "Please create a .env file and add FINNHUB_API_KEY=<your_key>"
    );
    process.exit(1);
  }

  // Set the token for all subsequent requests
  finnhubClient.defaults.params.token = apiKey;

  await server.start({
    transportType: "stdio",
  });
}

// This check ensures that the main function is only called when running the script directly
if (process.env.NODE_ENV !== "test") {
  main().catch(console.error);
}
