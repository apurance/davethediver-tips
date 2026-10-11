export const formatNumber = (n: number, maximumFractionDigits = 1) =>
  n.toLocaleString("zh-CN", { maximumFractionDigits });
