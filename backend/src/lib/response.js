export const ok = (res, data = null, meta = undefined, status = 200) => {
  const payload = { data };
  if (meta) payload.meta = meta;
  return res.status(status).json(payload);
};

export const fail = (res, status, message, details = undefined) => {
  const payload = { error: { message } };
  if (details !== undefined) payload.error.details = details;
  return res.status(status).json(payload);
};
