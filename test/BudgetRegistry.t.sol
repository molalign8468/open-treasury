// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {BudgetRegistry} from "../src/BudgetRegistry.sol";

contract CounterTest is Test {
    BudgetRegistry public budgetRegistry;

    address ministry1 = address(0x1);
    address ministry2 = address(0x2);
    address unauthorizedUser = address(0x3);


    function setUp() public {
        address[] memory authorized  = new address[](2);
        authorized[0] = ministry1;
        authorized[1] = ministry2;
        budgetRegistry = new BudgetRegistry(authorized);
    }

    function testAuthorizedMinistryIsRegistered() external view {
        assertTrue(budgetRegistry.authorizedMinistries(ministry1));
        assertTrue(budgetRegistry.authorizedMinistries(ministry2));
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
        
    function testUnauthorizedAddressCannotCreateBudget() public {
        vm.prank(unauthorizedUser);
        vm.expectRevert("You Are Not Autorized");
        budgetRegistry.createBudget("Health", 2018, 1000000);
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


}
