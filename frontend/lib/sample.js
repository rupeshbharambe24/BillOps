export function buildSamplePayload() {
  const now = Date.now();
  return [
    {
      event_id: `evt-${now}-001`,
      timestamp: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
      user_id: "user_100",
      amount: 250.0,
      type: "CREDIT",
    },
    {
      event_id: `evt-${now}-002`,
      timestamp: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      user_id: "user_100",
      amount: 80.5,
      type: "DEBIT",
    },
    {
      event_id: `evt-${now}-003`,
      timestamp: new Date(now - 1000 * 60 * 60 * 1).toISOString(),
      user_id: "user_200",
      amount: 420.0,
      type: "CREDIT",
    },
  ];
}

export function buildSampleJson() {
  return JSON.stringify(buildSamplePayload(), null, 2);
}
