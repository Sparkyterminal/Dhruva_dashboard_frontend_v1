/**
 * Runs `worker(item, index)` over `items` with at most `limit` in flight,
 * returning results in the original order.
 */
export const mapLimit = async (items, limit, worker) => {
  const results = new Array(items.length);
  let next = 0;
  const runners = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (next < items.length) {
        const i = next;
        next += 1;
        results[i] = await worker(items[i], i);
      }
    },
  );
  await Promise.all(runners);
  return results;
};
