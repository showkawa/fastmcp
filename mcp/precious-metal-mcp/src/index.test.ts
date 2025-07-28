import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  finnhubClient, // Import the real client
  getPreciousMetalPriceLogic,
  TROY_OUNCE_TO_GRAMS,
} from "./index.js";

// Set a dummy API key for tests to avoid the check in main code
finnhubClient.defaults.params = { token: "test_key" };

describe("getPreciousMetalPriceLogic", () => {
  let getSpy: any;

  beforeEach(() => {
    // Spy on the 'get' method of the real finnhubClient
    getSpy = vi.spyOn(finnhubClient, "get");
  });

  afterEach(() => {
    // Restore the spy after each test
    getSpy.mockRestore();
  });

  it("should calculate the price for gold in New York correctly", async () => {
    // Arrange: Set up the mock responses from the API
    getSpy.mockImplementation(
      (endpoint: string, { params }: { params: { symbol: string } }) => {
        if (params.symbol === "OANDA:XAU_USD") {
          return Promise.resolve({ data: { c: 2000 } }); // Gold price: $2000/oz
        }
        if (params.symbol === "OANDA:USD_CNY") {
          return Promise.resolve({ data: { c: 7.2 } }); // Exchange rate: 7.2 CNY/USD
        }
        return Promise.reject(new Error("Unexpected API call"));
      },
    );

    const args = {
      market: "new_york",
      metal: "gold",
      type: "spot",
    } as const;

    // Act: Call the function
    const result = await getPreciousMetalPriceLogic(args);

    // Assert: Check if the result is correct
    const expectedPrice = (2000 * 7.2) / TROY_OUNCE_TO_GRAMS;
    expect(result.converted_price.value).toBeCloseTo(expectedPrice, 2);
    expect(result.original_price.value).toBe(2000);
    expect(result.exchange_rate.rate).toBe(7.2);
    expect(result.converted_price.unit).toBe("CNY/gram");
  });

  it("should handle API failure gracefully", async () => {
    // Arrange: Mock a failed API call
    getSpy.mockRejectedValue(new Error("API is down"));

    const args = {
      market: "london",
      metal: "silver",
      type: "spot",
    } as const;

    // Act & Assert: Expect the function to throw an error
    await expect(getPreciousMetalPriceLogic(args)).rejects.toThrow(
      "API is down",
    );
  });

  it("should handle invalid price from API", async () => {
    // Arrange: Mock a response with a zero price
    getSpy.mockResolvedValue({ data: { c: 0 } });

    const args = {
      market: "new_york",
      metal: "gold",
      type: "spot",
    } as const;

    // Act & Assert
    await expect(getPreciousMetalPriceLogic(args)).rejects.toThrow(
      "Could not fetch a valid price for symbol OANDA:XAU_USD",
    );
  });
});
