import { Keypair } from '@solana/web3.js';
import { ethers } from 'ethers';
import * as ed25519 from 'ed25519-hd-key';
import * as bip39 from 'bip39';
import { ethPaths, solanaPaths } from './utils.js';

export function generateAddresses(mnemonic) {
  const seed = bip39.mnemonicToSeedSync(mnemonic);

  const ethAddresses = Object.fromEntries(
    Object.entries(ethPaths).map(([key, path]) => [
      key,
      { path, address: ethers.HDNodeWallet.fromPhrase(mnemonic, path).address },
    ])
  );

  const deriveSolanaAddress = (path) => {
    const derivedSeed = ed25519.derivePath(path, Buffer.from(seed, 'hex')).key;
    const keypair = Keypair.fromSeed(derivedSeed);
    return keypair.publicKey.toBase58();
  };

  const solanaAddresses = Object.fromEntries(
    Object.entries(solanaPaths).map(([key, path]) => [key, { path, address: deriveSolanaAddress(path) }])
  );

  return { ethAddresses, solanaAddresses };
}
