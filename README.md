# SLIP-39 Example Project

This project demonstrates the implementation of SLIP-39 (Shamir's Secret Sharing for Mnemonic Codes) in JavaScript, along with address generation for Ethereum and Solana blockchains.

Pages Hosted Demo: _Link_In_Progress_

## Features

- Generate mnemonics from dice rolls or use existing mnemonics
- Create SLIP-39 shares from mnemonics
- Generate Ethereum and Solana addresses from mnemonics
- Display QR codes for generated addresses
- Offline and online modes

## Installation

To install the project dependencies, run:

```bash
npm install
```

## Usage

This project includes two main modes of operation:

1. Online mode (browser-based): `index.html` and `index.js`
2. Offline mode (Node.js): `offline.js`

### Online Mode

To run the online mode:

1. Build the project:

   ```
   npm run build
   ```

2. Open the `dist/index.html` file in a web browser.

3. Use the interface to enter dice rolls or a mnemonic, and generate addresses and SLIP-39 shares.

### Offline Mode

To run the offline mode:

```
node offline.js
```

You can also use the `--guess` flag to generate random dice rolls for debugging:

```
node offline.js --guess
```

## Project Structure

- `index.html`: Main HTML file for the online interface
- `index.js`: Main JavaScript file for the online interface
- `offline.js`: Offline mode script
- `webpack.config.js`: Webpack configuration for building the online mode
- `package.json`: Project dependencies and scripts
- `.eslintrc.js`: ESLint configuration
- `.prettierrc`: Prettier configuration

## License

This project is released under the Unlicense. See the `LICENSE` file for details.
