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


}
