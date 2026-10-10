
import { ethers } from "ethers";
import CitizenTokenABI from "../contracts/CitizenTokenABI.json";

const TOKEN_ADDRESS = import.meta.env.VITE_CITIZEN_TOKEN_ADDRESS;

export async function getCitizenTokenBalance(address) {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  if (!TOKEN_ADDRESS || !ethers.isAddress(TOKEN_ADDRESS)) {
    throw new Error("Citizen Token contract address is missing or invalid.");
  }

  if (!ethers.isAddress(address)) {
    throw new Error("Invalid wallet address.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);

  const network = await provider.getNetwork();

  if (network.chainId !== 11155111n) {
    throw new Error("Please connect to the Sepolia network.");
  }

  const token = new ethers.Contract(
    TOKEN_ADDRESS,
    CitizenTokenABI,
    provider
  );

  const [balance, decimals, symbol] = await Promise.all([
    token.balanceOf(address),
    token.decimals(),
    token.symbol(),
  ]);

  return {
    balance: ethers.formatUnits(balance, decimals),
    symbol,
  };
}
