import { ethers } from "ethers";

import {
  CONTRACT_ADDRESS,
} from "../contracts/config";

import BudgetRegistryABI from "../contracts/BudgetRegistryABI.json";

import {
  getProvider,
  getSigner,
} from "./ethereum";


export function getReadOnlyContract() {
  const provider = getProvider();

  return new ethers.Contract(
    CONTRACT_ADDRESS,
    BudgetRegistryABI,
    provider
  );
}


export async function getWriteContract() {
  const signer = await getSigner();

  return new ethers.Contract(
    CONTRACT_ADDRESS,
    BudgetRegistryABI,
    signer
  );
}


export async function getNextBudgetId() {
  const contract = getReadOnlyContract();

  const nextId = await contract.getnextBudgetId();

  return Number(nextId);
}


export async function getBudget(budgetId) {
  const contract = getReadOnlyContract();

  const budget = await contract.budgets(budgetId);

  return {
    id: budgetId,
    ministry: budget[0],
    fiscalYear: Number(budget[1]),
    allocatedAmount: budget[2].toString(),
    disbursedAmount: budget[3].toString(),
    createdBy: budget[4],
    createdAt: Number(budget[5]),
    active: budget[6],
  };
}


export async function getAllBudgets() {
  const nextBudgetId = await getNextBudgetId();

  const budgets = [];

  for (let id = 1; id < nextBudgetId; id++) {
    const budget = await getBudget(id);

    budgets.push(budget);
  }

  return budgets;
}

export async function getNextProgramId() {
  const contract = getReadOnlyContract();

  const nextId = await contract.getnextProgramId();

  return Number(nextId);
}

export async function getProgram(programId) {
  const contract = getReadOnlyContract();

  const program = await contract.programs(programId);

  return {
    id: programId,
    budgetId: Number(program[0]),
    name: program[1],
    allocatedAmount: program[2].toString(),
    spentAmount: program[3].toString(),
    active: program[4],
  };
}

export async function getProgramsByBudget(budgetId) {
  const nextProgramId = await getNextProgramId();
  const programs = [];

  for (let id = 1; id < nextProgramId; id++) {
    const program = await getProgram(id);

    if (program.budgetId === Number(budgetId)) {
      programs.push(program);
    }
  }

  return programs;
}

export async function createProgram(
  name,
  allocatedAmount,
  budgetId
) {
  const contract = await getWriteContract();

  const tx = await contract.createProgram(
    name,
    allocatedAmount,
    budgetId
  );

  const receipt = await tx.wait();

  return {
    hash: receipt.hash,
    programId: null,
  };
}

export async function createBudget(
  ministry,
  fiscalYear,
  allocatedAmount
) {
  const contract = await getWriteContract();

  const tx = await contract.createBudget(
    ministry,
    fiscalYear,
    allocatedAmount
  );

  const receipt = await tx.wait();

  return {
    hash: receipt.hash,
    status: receipt.status,
  };
}

export async function isAuthorizedMinistry(address) {
  const contract = getReadOnlyContract();
  return await contract.authorizedMinistries(address);
}

export async function isAuthorizedSpender(address) {
  const contract = getReadOnlyContract();
  return await contract.authorizedSpenders(address);
}


export async function getAllPrograms() {
  const contract = getReadOnlyContract();

  // Solidity getter uses lowercase "n" in getnextProgramId
  const nextId = Number(await contract.getnextProgramId());
  const programs = [];

  for (let id = 1; id < nextId; id++) {
    const p = await contract.programs(id);

    if (p.active) {
      programs.push({
        id,
        budgetId: p.budgetId.toString(),
        name: p.name,
        allocatedAmount: p.allocatedAmount.toString(),
        spentAmount: p.spentAmount.toString(),
        active: p.active,
      });
    }
  }

  return programs;
}

export async function authorizeSpender(address) {
  const contract = await getWriteContract();
  const tx = await contract.authorizeSpender(address);
  const receipt = await tx.wait();

  return { hash: receipt.hash, status: receipt.status };
}

export async function revokeSpender(address) {
  const contract = await getWriteContract();
  const tx = await contract.revokeSpender(address);
  const receipt = await tx.wait();

  return { hash: receipt.hash, status: receipt.status };
}


export async function recordSpending(programId, amount, evidenceCID) {
  const contract = await getWriteContract();

  const tx = await contract.recordSpending(
    programId,
    amount,
    evidenceCID
  );

  const receipt = await tx.wait();

  if (receipt.status !== 1) {
    throw new Error("The spending transaction failed.");
  }

  return {
    hash: receipt.hash,
    status: receipt.status,
  };
}


export async function getAllSpendings() {
  const contract = getReadOnlyContract();

  const nextId = Number(await contract.getnextSpendingId());
  const spendings = [];

  for (let id = 1; id < nextId; id++) {
    const s = await contract.spendings(id);

    spendings.push({
      id,
      programId: s.programId.toString(),
      amount: s.amount.toString(),
      metadataCID: s.metadataCID,
      recordedBy: s.recordedBy,
      timestamp: s.timestamp.toString(),
    });
  }

  return spendings.reverse();
}