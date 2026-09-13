// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract BudgetRegistry {
    mapping(address => bool) public authorizedMinistries;

    constructor(address[] memory _authorizedMinistries ){
        for(uint256 i = 0; i < _authorizedMinistries.length; i++){
            authorizedMinistries[_authorizedMinistries[i]] = true;
        }
    }

   uint256 private nextBudgetId = 1;
   struct Budget {
        string ministry;
        uint16 fiscalYear;

        uint64 allocatedAmount;
        uint64 spentAmount;

        address createdBy;
        uint64 createdAt;
        bool active;
    }

    mapping(uint256 => Budget) public budgets;

    modifier onlyAuthorizedMinistries {
        require(authorizedMinistries[msg.sender],"You Are Not Autorized");
        _;
    }

    event BudgetCreated(
        uint256 indexed id,
        string ministry,
        uint16 fiscalYear,
        uint64 allocatedAmount,
        address createdBy
    );
    

    function createBudget(string memory _ministry,uint16 _fiscalYear,uint64 _allocatedAmount) external onlyAuthorizedMinistries {
        uint256 budgetId = nextBudgetId;
        budgets[budgetId] = Budget({
            ministry:_ministry,
            fiscalYear:_fiscalYear,
            allocatedAmount: _allocatedAmount,
            spentAmount:0,
            createdBy:msg.sender,
            createdAt: uint64(block.timestamp),
            active:true
        });
        nextBudgetId++;
        emit BudgetCreated(budgetId, _ministry, _fiscalYear, _allocatedAmount, msg.sender);
    }
}
