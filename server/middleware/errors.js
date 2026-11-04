export function notFound(_req, res) {
  res.status(404).json({ message: 'Resource not found' });
}

export function errorHandler(error, _req, res, _next) {
  if (error.code === 11000) {
    return res.status(409).json({ message: 'An account with that email already exists' });
  }
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: 'The submitted data is invalid' });
  }
  console.error(error);
  return res.status(500).json({ message: 'An unexpected server error occurred' });
}