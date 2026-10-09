// Runs cleanup, like leaving a Kafka consumer group, before the Claims API stops.
// `npm run dev` restarts the API every time you save, so a consumer that leaves cleanly
// lets the next one take over its partitions right away.

const cleanups: (() => Promise<void>)[] = [];

export function onShutdown(cleanup: () => Promise<void>) {
  cleanups.push(cleanup);
}

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, async () => {
    await Promise.allSettled(cleanups.map((cleanup) => cleanup()));
    process.exit(0);
  });
}
