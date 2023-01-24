import { useChain } from "@cosmos-kit/react";
import React, { useState } from "react";
import BigNumber from "bignumber.js";
import {
  defaultChainName,
  defaultChainSymbol,
  placeholderMntlUsdValue,
  placeholderRewards,
} from "../config";
import {
  fromChainDenom,
  sendRewardsBatched,
  useAllValidators,
  useDelegatedValidators,
  useMntlUsd,
  useTotalRewards,
} from "../data";
import TransactionManifestModal from "./TransactionManifestModal";

const denomDisplay = defaultChainSymbol;

const Rewards = ({ setShowClaimError, stakeState }) => {
  const walletManager = useChain(defaultChainName);
  const { delegatedValidators } = useDelegatedValidators();
  const { getSigningStargateClient, address, status, wallet } = walletManager;

  const { allRewards, rewardsArray, errorRewards } = useTotalRewards();
  const { mntlUsdValue, errorMntlUsdValue } = useMntlUsd();
  const { allValidators, isLoadingValidators, errorValidators } =
    useAllValidators();

  // console.log({ allRewards, rewardsArray });

  const selectedRewardsInWei = rewardsArray
    ?.filter((rewardObject) =>
      stakeState?.selectedValidators?.includes(rewardObject.validatorAddress)
    )
    .reduce(
      (accumulator, currentValue) =>
        accumulator.plus(new BigNumber(currentValue?.reward?.[0]?.amount) || 0),
      new BigNumber("0")
    );

  const selectedRewards = selectedRewardsInWei
    ?.dividedToIntegerBy(BigNumber(10).exponentiatedBy(18))
    .toString();

  const cumulativeRewards = errorRewards
    ? placeholderRewards
    : fromChainDenom(allRewards);

  const rewardsDisplay = stakeState?.selectedValidators.length
    ? fromChainDenom(selectedRewards)
    : cumulativeRewards;

  // console.log("rewardsDisplay: ", rewardsDisplay);

  const rewardsInUSDDisplay =
    errorRewards ||
    errorMntlUsdValue | isNaN(fromChainDenom(allRewards)) ||
    isNaN(parseFloat(mntlUsdValue))
      ? placeholderMntlUsdValue
      : (fromChainDenom(allRewards) * parseFloat(mntlUsdValue))
          .toFixed(6)
          .toString();

  const handleClaim = async () => {
    const { response, error } = await sendRewardsBatched(
      address,
      stakeState?.selectedValidators,
      stakeState?.memo,
      { getSigningStargateClient }
    );
    console.log("response: ", response, " error: ", error);
  };

  const [setupAddress, setSetupAddress] = useState(false);
  const [NewAddress, setNewAddress] = useState();

  const handleAddressChange = () => {
    // do something to change the address
    setSetupAddress(false);
  };

  return (
    <div className="nav-bg p-3 rounded-4 gap-3">
      <div className="d-flex flex-column gap-2">
        {stakeState?.selectedValidators.length ? (
          <p className="caption d-flex gap-2 align-items-center">
            Cumulative Rewards
          </p>
        ) : (
          <p
            className={`caption d-flex gap-2 align-items-center ${
              status === "Connected" ? null : "text-gray"
            }`}
          >
            {" "}
            Rewards
          </p>
        )}
        <p className={status === "Connected" ? "caption" : "caption text-gray"}>
          {rewardsDisplay}&nbsp;
          {denomDisplay}
        </p>
        <p
          className={status === "Connected" ? "caption2" : "caption2 text-gray"}
        >
          {rewardsInUSDDisplay}&nbsp;{"$USD"}
        </p>
        <div className="d-flex justify-content-end">
          {stakeState?.selectedValidators?.length > 5 ? null : (
            <button
              className="am-link text-start d-flex align-items-center gap-1"
              data-bs-toggle={
                delegatedValidators?.length > 5 &&
                stakeState?.selectedValidators.length === 0
                  ? ""
                  : "modal"
              }
              data-bs-target="#claimRewardsModal"
              onClick={() =>
                delegatedValidators?.length > 5 &&
                stakeState?.selectedValidators.length === 0 &&
                setShowClaimError(true)
              }
            >
              <i className="text-primary bi bi-box-arrow-in-down"></i>Claim
            </button>
          )}
        </div>
      </div>

      <div
        className="modal "
        tabIndex="-1"
        role="dialog"
        id="claimRewardsModal"
      >
        <div
          className="modal-dialog modal-dialog-centered"
          role="document"
          style={{ width: "min(100%,650px)", maxWidth: "min(100%,650px)" }}
        >
          {!setupAddress ? (
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title body2 text-primary d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn-close primary"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                    style={{ background: "none" }}
                  >
                    <span className="text-primary">
                      <i className="bi bi-chevron-left" />
                    </span>
                  </button>
                  Claim Rewards
                </h5>
                <button
                  type="button"
                  className="btn-close primary"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  style={{ background: "none" }}
                >
                  <span className="text-primary">
                    <i className="bi bi-x-lg" />
                  </span>
                </button>
              </div>
              <div className="modal-body p-4 d-flex flex-column text-white">
                <h6 className="caption2 my-1">
                  Total Available $MNTL rewards:
                </h6>
                <p className="body2 my-1">
                  {stakeState?.selectedValidators.length
                    ? fromChainDenom(selectedRewards)
                    : rewardsArray
                        ?.filter((item) =>
                          stakeState?.selectedValidators?.includes(
                            item?.validatorAddress
                          )
                        )
                        .reduce(
                          (accumulator, currentValue) =>
                            parseFloat(accumulator) +
                              parseFloat(currentValue?.reward[0]?.amount) || 0,
                          parseFloat(0)
                        )}{" "}
                  $MNTL
                </p>
                <p className="caption2 my-2 text-gray">Selected Validator</p>
                <div
                  className="nav-bg p-2 rounded-4 w-100"
                  style={{ overflowX: "auto" }}
                >
                  <table className="table claim-table">
                    <thead className="bt-0">
                      <tr>
                        <th
                          className="text-white caption2"
                          scope="col"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          Validator Name
                        </th>
                        <th
                          className="text-white caption2"
                          scope="col"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          Commission
                        </th>
                        <th
                          className="text-white caption2"
                          scope="col"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          Delegated Amount
                        </th>
                        <th
                          className="text-white caption2"
                          scope="col"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          Claimable Rewards
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stakeState?.selectedValidators.length ? (
                        delegatedValidators?.filter((item) =>
                          stakeState?.selectedValidators.includes(
                            item?.operatorAddress
                          )
                        ).length ? (
                          delegatedValidators
                            ?.filter((item) =>
                              stakeState?.selectedValidators.includes(
                                item?.operatorAddress
                              )
                            )
                            .map((item, index) => (
                              <tr key={index}>
                                <td className="caption2">
                                  {item?.description?.moniker}
                                </td>
                                {item?.commission?.commissionRates?.rate ==
                                0 ? (
                                  <td className="caption2">0 %</td>
                                ) : (
                                  <td className="caption2">
                                    {item?.commission?.commissionRates?.rate.slice(
                                      0,
                                      -16
                                    )}{" "}
                                    %
                                  </td>
                                )}
                                <td className="caption2">
                                  {item?.tokens / 1000000}
                                </td>
                                <td className="caption2">
                                  {fromChainDenom(
                                    new BigNumber(
                                      rewardsArray?.find(
                                        (element) =>
                                          element?.validatorAddress ===
                                          item?.operatorAddress
                                      )?.reward[0]?.amount
                                    )
                                      .dividedToIntegerBy(
                                        BigNumber(10).exponentiatedBy(18)
                                      )
                                      .toString()
                                  )}
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td className="text-white text-center" colSpan={4}>
                              None of the selected validators have been
                              delegated to
                            </td>
                          </tr>
                        )
                      ) : delegatedValidators?.length ? (
                        delegatedValidators?.map((item, index) => (
                          <tr key={index}>
                            <td className="caption2">
                              {item?.description?.moniker}
                            </td>
                            <td className="caption2">
                              {item?.commission?.commission_rates?.rate * 100}%
                            </td>
                            <td className="caption2">
                              {item?.tokens / 1000000}
                            </td>
                            <td className="caption2">
                              {fromChainDenom(
                                new BigNumber(
                                  rewardsArray?.find(
                                    (element) =>
                                      element?.validatorAddress ===
                                      item?.operatorAddress
                                  )?.reward[0]?.amount
                                )
                                  .dividedToIntegerBy(
                                    BigNumber(10).exponentiatedBy(18)
                                  )
                                  .toString()
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="text-white text-center" colSpan={4}>
                            No Record Found!!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <h6 className="caption my-2 mt-5">
                  Current wallet adress for claiming staking rewards:
                </h6>
                <p className="caption2 my-2 text-gray">{address}</p>
                <p className="caption2 my-2 text-gray">
                  Want to claim your staking rewards to another wallet address?{" "}
                  <a
                    href="#"
                    className="caption text-primary"
                    onClick={(e) => {
                      e.preventDefault();
                      setSetupAddress(true);
                    }}
                  >
                    Setup address
                  </a>
                </p>
                <div className="d-flex justify-content-end">
                  <button
                    className="btn btn-primary px-5 mt-3 text-right rounded-5"
                    data-bs-toggle="modal"
                    data-bs-target="#transactionManifestModal"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title body2 text-primary d-flex align-items-center gap-2">
                  <button onClick={() => setSetupAddress(false)}>
                    <i className="bi bi-chevron-left" />
                  </button>
                  Setup Rewards Withdrawal Address
                </h5>
                <button
                  type="button"
                  className="btn-close primary"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  style={{ background: "none" }}
                >
                  <span className="text-primary">
                    <i className="bi bi-x-lg" />
                  </span>
                </button>
              </div>
              <div className="modal-body p-4 d-flex flex-column text-white">
                <h6 className="caption2 my-1">Current Address</h6>
                <p className="caption2 my-1">{address}</p>
                <p className="caption2 my-2 text-gray">Revised Address</p>
                <input
                  type="text"
                  className="am-input py-1 px-3 border-color-white rounded-2 bg-t"
                  placeholder="Enter Withdraw Address"
                  onChange={(e) => setNewAddress(e.target.value)}
                />
                {NewAddress && NewAddress === address && (
                  <p className="caption2 text-error pt-1">
                    Revised Address can&apos;t be same as current address.
                  </p>
                )}
                <div className="d-flex justify-content-end">
                  <button
                    className="button-primary py-2 px-5 mt-3 caption text-center"
                    onClick={handleAddressChange}
                    disabled={
                      NewAddress &&
                      NewAddress !== address &&
                      NewAddress.length == 45
                        ? false
                        : true
                    }
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div
        className="modal "
        tabIndex="-1"
        role="dialog"
        id="transactionManifestModal"
      >
        <TransactionManifestModal
          displayData={[
            { title: "Claiming rewards to", value: address },
            {
              title: "Claiming rewards from",
              value: stakeState.selectedValidators.map((item) => item),
            },
            {
              title: "amount",
              value: stakeState?.selectedValidators.length
                ? fromChainDenom(selectedRewards)
                : rewardsArray
                    ?.filter((item) =>
                      stakeState?.selectedValidators?.includes(
                        item?.validatorAddress
                      )
                    )
                    .reduce(
                      (accumulator, currentValue) =>
                        parseFloat(accumulator) +
                          parseFloat(currentValue?.reward[0]?.amount) || 0,
                      parseFloat(0)
                    ),
            },
            { title: "Transaction Type", value: "Claim" },
            { title: "Wallet Type", value: wallet?.prettyName },
          ]}
          handleSubmit={handleClaim}
        />
      </div>
    </div>
  );
};

export default Rewards;
