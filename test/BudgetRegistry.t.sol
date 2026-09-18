// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {BudgetRegistry} from "../src/BudgetRegistry.sol";

contract CounterTest is Test {
    BudgetRegistry public budgetRegistry;

    address ministry1 = address(0x1);
    address ministry2 = address(0x2);
    address spender1 = address(0x4);
    address spender2 = address(0x5);
    address unauthorizedUser = address(0x3);


    function setUp() public {
        address[] memory authorized  = new address[](2);
        authorized[0] = ministry1;
        authorized[1] = ministry2;
        budgetRegistry = new BudgetRegistry(authorized);
        vm.startPrank(ministry1);
        budgetRegistry.authorizeSpender(spender1);
        budgetRegistry.authorizeSpender(spender2);
        vm.stopPrank();
    }

    function testAuthorizedMinistryIsRegistered() external view {
        assertTrue(budgetRegistry.authorizedMinistries(ministry1));
        assertTrue(budgetRegistry.authorizedMinistries(ministry2));
    }
    function testAuthorizedSpenderIsRegistered() external view {
        assertTrue(budgetRegistry.authorizedSpenders(spender1));
        assertTrue(budgetRegistry.authorizedSpenders(spender2));
    }

    function testRevokeSpender() external {
        vm.startPrank(ministry1);
        budgetRegistry.revokeSpender(spender1);
        assertFalse(budgetRegistry.authorizedSpenders(spender1));
        assertTrue(budgetRegistry.authorizedSpenders(spender2));
        vm.stopPrank();
    }

    function testAuthorizedMinistryCanCreateBudget() external {
        vm.startPrank(ministry1);
        budgetRegistry.createBudget("Health", 2018, 1000000);
        budgetRegistry.createBudget("Education",2018,2_000_000);
        vm.stopPrank();
        (
            string memory ministry,
            uint16 fiscalYear,
            uint64 allocatedAmount,
            uint64 spentAmount,
            address createdBy,
            uint64 createdAt,
            bool active
        ) = budgetRegistry.budgets(1);

        assertEq(ministry, "Health");
        assertEq(fiscalYear, 2018);
        assertEq(allocatedAmount, 1_000_000);
        assertEq(spentAmount, 0);
        assertEq(createdBy, ministry1);
        assertGt(createdAt, 0);
        assertTrue(active);
        assertEq(budgetRegistry.getnextBudgetId(), 3);
    }

    function testAuthorizedMinistryCanCreateProgram() external {
        vm.startPrank(ministry1);
        budgetRegistry.createBudget("Health", 2018, 1000000);

        budgetRegistry.createProgram("Medicines",500000,1);
        vm.stopPrank();
        (
            uint256 budgetId,
            string memory name,
            uint64 allocatedAmount,
            uint64 spentAmount,
            bool active
        ) = budgetRegistry.programs(1);

        assertEq(budgetId, 1);
        assertEq(name, "Medicines");
        assertEq(allocatedAmount, 500000);
        assertEq(spentAmount, 0);
        assertTrue(active);
    }

    function testAuthorizedSpenderCanSpend() external {
        vm.startPrank(ministry1);
        budgetRegistry.createBudget("Health", 2018, 1000000);
        budgetRegistry.createProgram("Medicines",500000,1);
        vm.stopPrank();
        vm.prank(spender1);
        vm.warp(1700000000);
        budgetRegistry.recordSpending(1,200000,"Qmscshsd");

        (,,,uint64 spentAmount,) = budgetRegistry.programs(1);

        (
            uint256 programId,
            uint64 amount,
            string memory evidenceCID,
            address recordedBy,
            uint64 timestamp
        ) = budgetRegistry.spendings(1);

        assertEq(programId, 1);
        assertEq(amount,200000);
        assertEq(evidenceCID, "Qmscshsd");
        assertEq(recordedBy, spender1);
        assertEq(timestamp, 1700000000);
        assertEq(spentAmount, 200000);
    }
        
    function testUnauthorizedAddressCannotCreateBudget() public {
        vm.prank(unauthorizedUser);
        vm.expectRevert("You Are Not Autorized");
        budgetRegistry.createBudget("Health", 2018, 1000000);
    }
    function testUnauthorizedAddressCannotSpend() public {
        vm.startPrank(ministry1);
        budgetRegistry.createBudget("Health", 2018, 1000000);
        budgetRegistry.createProgram("Medicines",500000,1);
        vm.stopPrank();
        vm.prank(unauthorizedUser);
        vm.expectRevert("Not authorized spender");
        budgetRegistry.recordSpending(1,2000000,"Qmscshsd");
    }
    function testUnauthorizedAddressCannotCreateProgram() public {
        vm.prank(ministry1);
        budgetRegistry.createBudget("Health", 2018, 1000000);
        vm.prank(unauthorizedUser);
        vm.expectRevert("You Are Not Autorized");
        budgetRegistry.createProgram("Medicines",500000,1);
        
    }

    function testCannotCreatProgramNoBudgetCreated() external {
        vm.prank(ministry1);
        vm.expectRevert("Budget is not active");
        budgetRegistry.createProgram("Medicines",500000,1);
    }
    function testCannotCreatProgramAllocatedAmountExceedBaseBudget() external {
        vm.startPrank(ministry1);
        budgetRegistry.createBudget("Health", 2018, 1000000);
        vm.expectRevert("Exceeds available budget");
        budgetRegistry.createProgram("Medicines",5000000,1);
        vm.stopPrank();
    }

    function testFuzz_CreateBudget(uint16 _fiscalYear,uint64 _allocatedAmount) external {
        vm.prank(ministry1);
        budgetRegistry.createBudget("Health", _fiscalYear, _allocatedAmount);
        (
            string memory ministry,
            uint16 fiscalYear,
            uint64 allocatedAmount,
            uint64 spentAmount,
            address createdBy,,
            bool active
        ) = budgetRegistry.budgets(1);

        assertEq(ministry, "Health");
        assertEq(fiscalYear, _fiscalYear); 
        assertEq(allocatedAmount, _allocatedAmount); 
        assertEq(spentAmount, 0); assertEq(createdBy, ministry1); 
        assertTrue(active);

    }
    function testFuzz_CreateProgram( uint64 programAllocation ) public {
        uint64 budgetAmount = 10_000_000;

        vm.assume(programAllocation > 0);
        vm.assume(programAllocation <= budgetAmount);

        vm.prank(ministry1);

        budgetRegistry.createBudget(
            "Ministry of Health",
            2026,
            budgetAmount
        );

        vm.prank(ministry1);

        budgetRegistry.createProgram(
            "Hospital Development",
            programAllocation,
            1
        );

        (
            ,
            ,
            uint64 allocatedAmount,
            uint64 spentAmount,
            bool active
        ) = budgetRegistry.programs(1);

        assertEq(allocatedAmount, programAllocation);
        assertEq(spentAmount, 0);
        assertTrue(active);
    }

    function testFuzz_MultipleBudgets( uint64 amount1, uint64 amount2, uint16 year1, uint16 year2 ) public {
         vm.startPrank(ministry1); 
         budgetRegistry.createBudget( "Health", year1, amount1 ); 
         budgetRegistry.createBudget( "Education", year2, amount2 ); 
         vm.stopPrank(); 
         ( 
            string memory ministryA, 
            uint16 fiscalYearA, 
            uint64 allocatedA, , 
            address creatorA, , 
            bool activeA 
        ) = budgetRegistry.budgets(1); 
        ( 
            string memory ministryB, 
            uint16 fiscalYearB, 
            uint64 allocatedB, , 
            address creatorB, , 
            bool activeB 
        ) = budgetRegistry.budgets(2); 

        assertEq(ministryA, "Health"); 
        assertEq(fiscalYearA, year1); 
        assertEq(allocatedA, amount1); 
        assertEq(creatorA, ministry1); 
        assertTrue(activeA); 
        
        assertEq(ministryB, "Education"); 
        assertEq(fiscalYearB, year2); 
        assertEq(allocatedB, amount2); 
        assertEq(creatorB, ministry1); 
        assertTrue(activeB); 
    }

    function testFuzz_UnauthorizedCannotCreateBudget(address caller,uint16 fiscalYear, uint64 amount) external{
        vm.assume(caller != ministry1);
        vm.assume(caller != ministry2);

        vm.prank(caller);
        vm.expectRevert("You Are Not Autorized");
        budgetRegistry.createBudget( "Health", fiscalYear, amount); 

    }

    function testFuzzTotalSpendingLessThanProgramAllocation(uint64 budgetAmount,uint64 progamAloction, uint64 spendingamount) external{
        vm.assume(spendingamount <= progamAloction && progamAloction <= budgetAmount && progamAloction > 0);
        vm.startPrank(ministry1);
        budgetRegistry.createBudget("Health", 2018, budgetAmount);
        budgetRegistry.createProgram("Medicines",progamAloction,1);
        vm.stopPrank();
        vm.prank(spender1);
        vm.warp(1700000000);
        budgetRegistry.recordSpending(1,spendingamount,"Qmscshsd");

        (,,,uint64 spentAmount,) = budgetRegistry.programs(1);

        (
            uint256 programId,
            uint64 amount,
            string memory evidenceCID,
            address recordedBy,
            uint64 timestamp
        ) = budgetRegistry.spendings(1);

        assertEq(programId, 1);
        assertEq(amount,spendingamount);
        assertEq(evidenceCID, "Qmscshsd");
        assertEq(recordedBy, spender1);
        assertEq(timestamp, 1700000000);
        assertEq(spentAmount, spendingamount);
    }
    function testFuzz_OnlyAuthorizedAddressesCanCreate(address caller) external {
        bool authorized = caller == ministry1 || caller == ministry2;
        vm.prank(caller);
        if(authorized){
            budgetRegistry.createBudget("Health", 2018, 1000000);
            ( , , , , address createdBy, , ) = budgetRegistry.budgets(1);
            assertEq(createdBy, caller);
        }else{
            vm.expectRevert("You Are Not Autorized");
            budgetRegistry.createBudget("Health", 2018, 1000000);
        }
    }
    function testFuzz_CreateProgram_Name(string memory name) public {
            vm.assume(bytes(name).length > 0);
            vm.prank(ministry1);

            budgetRegistry.createBudget(
                "Ministry of Health",
                2026,
                10_000_000
            );

            vm.prank(ministry1);

            budgetRegistry.createProgram(
                name,
                1_000_000,
                1
            );

            (
                ,
                string memory storedName,
                ,
                ,
                
            ) = budgetRegistry.programs(1);

            assertEq(storedName, name);
        }

    function test_MaxUint64Allocation() external {
        vm.prank(ministry1);
        budgetRegistry.createBudget("Health", 2018, type(uint64).max);
        ( , , uint64 allocatedA, , , , ) = budgetRegistry.budgets(1);
        assertEq(allocatedA, type(uint64).max);   
    }
    function test_StateDoesNotChangeAfterUnauthorizedCall() public { 
        vm.prank(ministry1); 
        budgetRegistry.createBudget( "Health", 2026, 1_000_000 ); 

        vm.prank(unauthorizedUser); 
        vm.expectRevert("You Are Not Autorized"); 
        budgetRegistry.createBudget( "Finance", 2026, 5_000_000 ); 

        ( 
            string memory ministry, 
            uint16 fiscalYear, 
            uint64 allocatedAmount, 
            uint64 spentAmount, 
            address createdBy, , 
            bool active 
        ) = budgetRegistry.budgets(1);

        assertEq(ministry, "Health"); 
        assertEq(fiscalYear, 2026); 
        assertEq(allocatedAmount, 1_000_000); 
        assertEq(spentAmount, 0); 
        assertEq(createdBy, ministry1); 
        assertTrue(active); 
    }

    function test_IdStateDoesNotChangeAfterUnauthorizedCall() external {
        vm.prank(unauthorizedUser); 
        vm.expectRevert("You Are Not Autorized"); 
        budgetRegistry.createBudget( "Finance", 2026, 5_000_000 ); 
        assertEq(budgetRegistry.getnextBudgetId(), 1);
    }

    function test_CreatePrograms_IdsAreSequential() public {
        vm.prank(ministry1);

        budgetRegistry.createBudget(
            "Ministry of Health",
            2026,
            10_000_000
        );

        vm.startPrank(ministry1);

        budgetRegistry.createProgram(
            "Hospitals",
            1_000_000,
            1
        );

        budgetRegistry.createProgram(
            "Medicines",
            2_000_000,
            1
        );

        vm.stopPrank();

        (
            ,
            string memory name1,
            ,
            ,
            
        ) = budgetRegistry.programs(1);

        (
            ,
            string memory name2,
            ,
            ,
            
        ) = budgetRegistry.programs(2);

        assertEq(name1, "Hospitals");
        assertEq(name2, "Medicines");
    }

    function test_CreateProgram_EmitsEvent() public {
        vm.prank(ministry1);

        budgetRegistry.createBudget(
            "Ministry of Health",
            2026,
            10_000_000
        );

        vm.expectEmit(true, true, false, true);

        emit BudgetRegistry.ProgramCreated(
            1,
            1,
            "Hospital Development",
            1_000_000,
            ministry1
        );

        vm.prank(ministry1);

        budgetRegistry.createProgram(
            "Hospital Development",
            1_000_000,
            1
        );
  }


}
