 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CitizenToken is ERC20, Ownable {
    uint256 public constant REPORT_REWARD = 10 * 10 ** 18;

    mapping(bytes32 => bool) public rewardedReports;

    event CitizenRewarded(
        bytes32 indexed reportKey,
        address indexed reporter,
        uint256 amount
    );

    constructor() ERC20("Citizen Token", "CITIZEN") Ownable(msg.sender) {}

    /// @notice Rewards a citizen for an approved report.
    /// @dev Only the contract owner can issue rewards.
    ///      Each report can be rewarded only once.
    function rewardCitizen(
        address reporter,
        bytes32 reportKey
    ) external onlyOwner {
        require(reporter != address(0), "Invalid reporter");
        require(reportKey != bytes32(0), "Invalid report key");
        require(!rewardedReports[reportKey], "Report already rewarded");

        rewardedReports[reportKey] = true;

        _mint(reporter, REPORT_REWARD);

        emit CitizenRewarded(reportKey, reporter, REPORT_REWARD);
    }
}
