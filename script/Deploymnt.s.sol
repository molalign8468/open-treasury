// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {BudgetRegistry} from "../src/BudgetRegistry.sol";

contract BudgetRegistryScript is Script {
    BudgetRegistry public budgetRegistry;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        address[] memory authorized  = new address[](2);
        authorized[0] = address(0x1);
        authorized[1] = address(0x2);

        budgetRegistry = new BudgetRegistry(authorized);

        vm.stopBroadcast();
    }
}
