// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {BudgetRegistry} from "../src/BudgetRegistry.sol";

contract DeployBudgetRegistry is Script {
    function run() external returns (BudgetRegistry) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        address[] memory authorizedMinistries = new address[](1);
        authorizedMinistries[0] = deployer;

        vm.startBroadcast(deployerPrivateKey);

        BudgetRegistry registry = new BudgetRegistry(
            authorizedMinistries
        );

        vm.stopBroadcast();

        console.log("BudgetRegistry deployed at:", address(registry));
        console.log("Authorized ministry:", deployer);

        return registry;
    }
}