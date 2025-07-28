# Precious Metal Price MCP Tool

An MCP (Model Context Protocol) tool to fetch the daily prices of gold and silver from major international markets, with conversion to Chinese Yuan (CNY) per gram.

This tool is designed to be used within MCP-compatible environments or as a standalone command-line utility via `npx`.

## Features

- Fetches prices for **Gold** and **Silver**.
- Supports **Spot** and **Futures** price types.
- Covers major markets: **New York**, **London**, and **Shanghai**.
- Converts prices from their native currency (e.g., USD/oz) to **CNY/gram**.
- Includes the exchange rate used in the conversion.
- All data is sourced from the [Finnhub.io](https://finnhub.io/) API.

## Configuration

Before using this tool, you must configure your Finnhub API key.

**1. Get your API Key**

Sign up for a free API key at [finnhub.io](https://finnhub.io/).

**2. Set up the Environment Variable**

This tool requires the `FINNHUB_API_KEY` environment variable to be set. You can do this in one of two ways:

### Option A: Using a `.env` file (Recommended for development)

1. In the root directory of this project, create a file named `.env`.
2. Add the following line to the file, replacing `your_api_key_here` with your actual key:

   ```
   FINNHUB_API_KEY=your_api_key_here
   ```

   The `.gitignore` file is configured to prevent the `.env` file from being committed to your repository.

### Option B: System Environment Variable (Recommended for production)

Set the environment variable directly in your operating system's shell.

- **Linux / macOS:**

  ```bash
  export FINNHUB_API_KEY=your_api_key_here
  ```

- **Windows (PowerShell):**

  ```powershell
  $env:FINNHUB_API_KEY="your_api_key_here"
  ```

## Installation and Usage

As this is a self-contained MCP tool designed to be run via `npx` or directly with `ts-node`, there's no traditional installation step.

### For Development

To run the server directly during development, use the `dev` script:

```bash
npm run dev
```

This will start the MCP server, listening for requests on `stdio`.

### Building for Production

To compile the TypeScript code into JavaScript, run the build script:

```bash
npm run build
```

This will create the compiled output in the `/dist` directory.

### Code Formatting

To ensure consistent code style, please run Prettier before committing changes:

```bash
npx prettier --write .
```

### Running as a Tool

Once built, you can run the tool via its `bin` entry (assuming it's been linked globally with `npm link` or published to npm):

```bash
precious-metal-mcp
```

## MCP Tool Definition

- **Tool Name**: `getPreciousMetalPrice`
- **Description**: Fetches the daily price of gold or silver from a specified market and converts it to CNY per gram.
- **Parameters**:
  - `metal` (string, required): The metal to query. Can be `"gold"` or `"silver"`.
  - `type` (string, required): The price type. Can be `"spot"` or `"futures"`.
  - `market` (string, required): The trading market. Can be `"new_york"`, `"london"`, or `"shanghai"`.
- **Example Output**:

  ```json
  {
    "metal": "gold",
    "type": "spot",
    "market": "new_york",
    "original_price": {
      "value": 2350.55,
      "unit": "USD/oz"
    },
    "converted_price": {
      "value": 558.85,
      "unit": "CNY/gram"
    },
    "exchange_rate": {
      "from": "USD",
      "to": "CNY",
      "rate": 7.25
    },
    "timestamp": "2023-10-28T10:00:00.000Z"
  }
  ```
