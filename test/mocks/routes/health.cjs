module.exports = [
  {
    id: "get-health",
    url: "/health",
    method: "GET",
    variants: [
      {
        id: "ok",
        type: "json",
        options: {
          status: 200,
          body: { ok: true },
        },
      },
      {
        id: "down",
        type: "json",
        options: {
          status: 500,
          body: { ok: false },
        },
      },
    ],
  },
];
