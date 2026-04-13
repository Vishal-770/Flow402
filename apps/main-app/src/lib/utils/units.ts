/**
 * Converts a decimal string to atomic units (as a bigint string)
 * Example: parseUnits("0.01", 6) -> "10000"
 */
export function parseUnits(value: string, decimals: number): bigint {
  if (!value) return BigInt(0);
  
  // Remove commas and handle negative sign if any (though usually not for prices)
  const cleanValue = value.replace(/,/g, "");
  const isNegative = cleanValue.startsWith("-");
  const absoluteValue = isNegative ? cleanValue.slice(1) : cleanValue;
  
  const [integer, fractionRest = ""] = absoluteValue.split(".");
  let fraction = fractionRest;
  
  // Truncate fraction to decimals
  if (fraction.length > decimals) {
    fraction = fraction.slice(0, decimals);
  }
  
  // Pad fraction with trailing zeros
  fraction = fraction.padEnd(decimals, "0");
  
  const result = BigInt(integer + fraction);
  return isNegative ? -result : result;
}

/**
 * Converts atomic units (string or bigint) to a human-readable decimal string
 * Example: formatUnits("10000", 6) -> "0.01"
 */
export function formatUnits(value: string | bigint | number, decimals: number): string {
  let stringValue = value.toString();
  if (stringValue === "0" || !stringValue) return "0";
  
  const isNegative = stringValue.startsWith("-");
  if (isNegative) stringValue = stringValue.slice(1);
  
  // Pad with leading zeros if necessary to ensure it has at least decimals + 1 digits
  stringValue = stringValue.padStart(decimals + 1, "0");
  
  const integerPart = stringValue.slice(0, -decimals) || "0";
  let fractionPart = stringValue.slice(-decimals);
  
  // Remove trailing zeros from fraction
  fractionPart = fractionPart.replace(/0+$/, "");
  
  const result = fractionPart ? `${integerPart}.${fractionPart}` : integerPart;
  return isNegative ? `-${result}` : result;
}
