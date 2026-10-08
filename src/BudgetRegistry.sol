// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract BudgetRegistry {
    mapping(address => bool) public authorizedMinistries;
    mapping(address => bool) public authorizedSpenders;

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
        uint64 disbursedAmount;

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
   uint256 private nextSpendingId = 1;
    struct Spending {
        uint256 programId;
        uint64 amount;
        string metadataCID;
        address recordedBy;
        uint64 timestamp;
    }


    mapping(uint256 => Budget) public budgets;
    mapping(uint256 => Program) public programs;
    mapping(uint256 => Spending) public spendings;


    modifier onlyAuthorizedMinistries {
        require(authorizedMinistries[msg.sender],"You Are Not Autorized");
        _;
    }
    modifier onlyAuthorizedSpender() {
        require(authorizedSpenders[msg.sender],"Not authorized spender");
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
        uint256 indexed budgetId,
        string name,
        uint64 allocatedAmount,
        address createdBy
    );
    event SpendingRecorded( 
        uint256 indexed spendingId, 
        uint256 indexed programId, 
        uint64 amount, 
        string evidenceCID, 
        address recordedBy 
    );
    event SpenderAuthorized(address indexed spender,address byWho);
    event SpenderRevoked(address indexed spender,address byWho);
    
    function authorizeSpender(address _spender) external onlyAuthorizedMinistries {
        authorizedSpenders[_spender] = true;
        emit SpenderAuthorized(_spender,msg.sender);
    }
    function revokeSpender(address _spender) external onlyAuthorizedMinistries {
        authorizedSpenders[_spender] = false;
        emit SpenderRevoked(_spender,msg.sender);
    }

    function createBudget(string memory _ministry,uint16 _fiscalYear,uint64 _allocatedAmount) external onlyAuthorizedMinistries {
        uint256 budgetId = nextBudgetId;
        budgets[budgetId] = Budget({
            ministry:_ministry,
            fiscalYear:_fiscalYear,
            allocatedAmount: _allocatedAmount,
            disbursedAmount:0,
            createdBy:msg.sender,
            createdAt: uint64(block.timestamp),
            active:true
        });
        nextBudgetId++;
        emit BudgetCreated(budgetId, _ministry, _fiscalYear, _allocatedAmount, msg.sender);
    }

    function createProgram(string memory _name,uint64 _allocatedAmount,uint256 _budgetId) external onlyAuthorizedMinistries {
        Budget storage budget = budgets[_budgetId];
        require(budget.active, "Budget is not active");
        require(bytes(_name).length > 0, "Program name is empty");
        require(_allocatedAmount > 0, "Allocation must be greater than zero");
        require( budget.allocatedAmount - budget.disbursedAmount >= _allocatedAmount, "Exceeds available budget" );

        uint256 programId = nextProgramId;
        programs[programId] = Program({
            budgetId:_budgetId,
            name:_name,
            allocatedAmount:_allocatedAmount,
            spentAmount:0,
            active:true
        });
        budget.disbursedAmount += _allocatedAmount;
        nextProgramId++;
        emit ProgramCreated(programId,_budgetId, _name, _allocatedAmount, msg.sender);
    }
    
    function recordSpending(uint256 _programId, uint64 _amount, string memory _metadataCID) external onlyAuthorizedSpender {
        Program storage program = programs[_programId];
        require(program.active,"Program is not active");
        require(_amount <= program.allocatedAmount - program.spentAmount,"Exceeds program allocation");
        require(bytes(_metadataCID).length > 0, "Evidence is required");

        uint256 spendingId = nextSpendingId;
        spendings[spendingId] = Spending({
            programId: _programId, 
            amount: _amount, 
            metadataCID: _metadataCID, 
            recordedBy: msg.sender, 
            timestamp: uint64(block.timestamp)
        });
        program.spentAmount += _amount;
        nextSpendingId++ ;
        emit SpendingRecorded( spendingId, _programId, _amount, _metadataCID, msg.sender);
    }

    function getnextBudgetId() external view returns(uint256){
        return nextBudgetId;
    }
    
    function getnextProgramId() external view returns(uint256) {
        return nextProgramId;
    }

    function getnextSpendingId() external view returns(uint256) {
        return nextSpendingId;
    }
}
