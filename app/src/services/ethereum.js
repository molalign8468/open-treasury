import { ethers } from "ethers";

export function getProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  return new ethers.BrowserProvider(window.ethereum);
}

export async function getAccount() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const accounts = await window.ethereum.request({
    method: "eth_accounts",
  });

  return accounts[0] || null;
}
export async function getSigner() {
  const provider = getProvider();

  await provider.send("eth_requestAccounts", []);

  return provider.getSigner();
}

export async function requestAccounts() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  return accounts[0] || null;
}

export async function getChainId() {
  const provider = getProvider();
  const network = await provider.getNetwork();

  return Number(network.chainId);
}

export async function switchToSepolia() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [
        {
          chainId: "0xaa36a7",
        },
      ],
    });
  } catch (error) {
    // Sepolia isn't added to MetaMask
    if (error.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0xaa36a7",
            chainName: "Sepolia",
            nativeCurrency: {
              name: "Sepolia Ether",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: [
              "https://rpc.sepolia.org",
            ],
            blockExplorerUrls: [
              "https://sepolia.etherscan.io",
            ],
          },
        ],
      });
    } else {
      throw error;
    }
  }
}