import React from "react";
import { farmPools } from "../data";
import { disconnect } from "@wagmi/core";

export default function LiquidityPoolChainCard({
  setSelectedPool,
  selectedPool,
  appIndex,
  poolIndex,
}) {
  const selectedApp = farmPools?.[appIndex];
  const pool = selectedApp?.pools?.[poolIndex];
  const tokenPairArray = pool?.tokens?.split?.(" – ");

  const handleOnClickPair = async (e) => {
    e.preventDefault();
    if (
      selectedPool.poolIndex !== poolIndex ||
      selectedPool.appIndex !== appIndex
    ) {
      await disconnect();
      setSelectedPool({
        appIndex,
        poolIndex,
      });
    }
  };
  return (
    <div
      className={`d-flex align-items-center justify-content-between px-3 py-2 rounded-4 ${
        selectedPool.poolIndex === poolIndex &&
        selectedPool.appIndex === appIndex
          ? "border-color-primary"
          : "border-color-primary-hover"
      }`}
      role={
        selectedPool.poolIndex === poolIndex &&
        selectedPool.appIndex === appIndex
          ? ""
          : "button"
      }
      onClick={handleOnClickPair}
      style={{
        cursor:
          selectedPool.poolIndex === poolIndex &&
          selectedPool.appIndex === appIndex
            ? "default"
            : "pointer",
      }}
    >
      <div className="d-flex align-items-center gap-1">
        <div
          className="position-relative"
          style={{ width: "52px", aspectRatio: "72/40" }}
        >
          <div
            className="position-absolute end-0 overflow-hidden"
            style={{ width: "30px", aspectRatio: "1/1" }}
          >
            <img
              src={`/farm/icons/${tokenPairArray?.[1]?.toLowerCase?.()}.svg`}
              alt={`${tokenPairArray?.[1]} icon`}
              className="w-100 h-100"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
          </div>
          <div
            className="position-absolute start-0 overflow-hidden"
            style={{ width: "30px", aspectRatio: "1/1" }}
          >
            <img
              src={`/farm/icons/${tokenPairArray?.[0]?.toLowerCase?.()}.svg`}
              alt={`${tokenPairArray?.[0]} icon`}
              className="w-100 h-100"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
          </div>
        </div>
        <h2 className="caption2 text-primary m-0">
          {pool?.tokens && pool?.tokens}
        </h2>
      </div>
      <p className="small m-0 text-gray">
        {pool && pool?.apr && `APR: ${pool?.apr}`}
      </p>
    </div>
  );
}
