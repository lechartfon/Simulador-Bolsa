export function simulateGBM({ S0, mu, sigma, days }) {
    const prices = [S0];
    const dt = 1 / 252; // suponer 252 días hábiles al año
    for (let i = 1; i <= days; i++) {
      const prev = prices[i - 1];
      // generación de número normal con Box–Muller
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const change = (mu - 0.5 * sigma ** 2) * dt + sigma * Math.sqrt(dt) * z;
      const next = prev * Math.exp(change);
      prices.push(Math.max(0.1, Math.round(next * 100) / 100)); // evitar <=0
    }
    return prices;
  }
  