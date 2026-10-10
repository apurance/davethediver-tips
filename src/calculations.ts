export function calculateMenu(input: {
  customers: number;
  branch: number;
  served: number;
  price: number;
  portions: number;
  premium: number;
  multiplier: number;
  cost: number;
}) {
  const mainActual = Math.floor(
    (Math.max(0, input.customers) * Math.min(100, Math.max(0, input.served))) /
      100,
  );
  const branchActual = Math.floor(
    (Math.max(0, input.branch) * Math.min(100, Math.max(0, input.served))) /
      100,
  );
  const actual = mainActual + branchActual;
  const portions = Math.max(1, Math.floor(input.portions));
  const mainBatches = Math.ceil(mainActual / portions),
    branchBatches = Math.ceil(branchActual / portions);
  const batches = mainBatches + branchBatches,
    bonus = Math.min(actual, Math.max(0, Math.floor(input.premium)));
  const revenue =
    actual * input.price +
    bonus * input.price * (Math.max(1, input.multiplier) - 1);
  return {
    actual,
    mainActual,
    branchActual,
    mainBatches,
    branchBatches,
    batches,
    bonus,
    revenue,
    waste: batches * portions - actual,
    net: revenue - input.cost,
  };
}
export function calculateSupply(
  ingredients: [string, number][],
  supply: Record<string, number>,
  portions: number,
) {
  const capacities = ingredients.map(([name, quantity]) => ({
    name,
    plates: Math.floor(Math.max(0, supply[name] ?? 0) / quantity) * portions,
  }));
  const plates = capacities.length
    ? Math.min(...capacities.map((c) => c.plates))
    : 0;
  return {
    plates,
    capacities,
    maximum: Math.max(1, ...capacities.map((c) => c.plates)),
  };
}
