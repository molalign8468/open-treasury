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
   uint256 private nextProgramId = 1;
    struct Program {
        uint256 budgetId;
        string name;
        uint64 allocatedAmount;
        uint64 spentAmount;
        bool active;
    }

    mapping(uint256 => Budget) public budgets;
    mapping(uint256 => Program) public programs;

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
    event ProgramCreated(
        uint256 indexed id,
        string name,
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

    function createProgram(string memory _name,uint64 _allocatedAmount,uint256 _budgetId) external {
        uint256 programId = nextProgramId;
        programs[programId] = Program({
            budgetId:_budgetId,
            name:_name,
            allocatedAmount:_allocatedAmount,
            spentAmount:0,
            active:true
        });
        nextProgramId++;
        emit ProgramCreated(programId, _name, _allocatedAmount, msg.sender);
    }


    function getnextBudgetId() external view returns(uint256){
        return nextBudgetId;
    }
}
