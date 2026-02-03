function solscanClusterSuffix(): string {
  const cluster = (process.env.SOLSCAN_CLUSTER || "").trim().toLowerCase();
  if (!cluster || cluster === "mainnet" || cluster === "mainnet-beta") return "";
  if (cluster === "devnet" || cluster === "testnet") return `?cluster=${cluster}`;
  // Unknown value: treat as no suffix to avoid broken links.
  return "";
}

export function solscanTxUrl(signature: string): string {
  return `https://solscan.io/tx/${signature}${solscanClusterSuffix()}`;
}

export function solscanBlockUrl(slot: number): string {
  return `https://solscan.io/block/${slot}${solscanClusterSuffix()}`;
}

