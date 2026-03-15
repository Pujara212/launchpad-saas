/** Standardised API response helpers */

exports.success = (res, data = {}, message = "Success", statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

exports.created = (res, data = {}, message = "Created successfully") =>
  res.status(201).json({ success: true, message, data });

exports.badRequest = (res, message = "Bad request", errors = null) =>
  res.status(400).json({ success: false, message, ...(errors && { errors }) });

exports.unauthorized = (res, message = "Unauthorized") =>
  res.status(401).json({ success: false, message });

exports.forbidden = (res, message = "Forbidden") =>
  res.status(403).json({ success: false, message });

exports.notFound = (res, message = "Not found") =>
  res.status(404).json({ success: false, message });

exports.conflict = (res, message = "Conflict") =>
  res.status(409).json({ success: false, message });

exports.serverError = (res, message = "Internal server error") =>
  res.status(500).json({ success: false, message });
