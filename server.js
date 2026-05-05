// server.js
const express = require('express');
const { trace, context, SpanStatusCode } = require('@opentelemetry/api');
const { httpRequestCounter, httpRequestDuration } = require('./tracing');

const app = express();
const PORT = process.env.PORT || 3000;

const orders = [
  { id: 1, item: 'Laptop', status: 'shipped' },
  { id: 2, item: 'Phone', status: 'processing' },
  { id: 3, item: 'Tablet', status: 'delivered' },
];

// 🔹 Middleware for metrics 
app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    httpRequestCounter.add(1, {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: String(res.statusCode), 
    });

    httpRequestDuration.record(duration, {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: String(res.statusCode),
    });
  });

  next();
});

// ── GET /health ─────────────────────────────────────────
app.get('/health', (req, res) => {
  const tracer = trace.getTracer('orders-service');
  const span = tracer.startSpan('health-check');

  context.with(trace.setSpan(context.active(), span), () => {
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    console.log(JSON.stringify({
      level: 'INFO',
      message: 'Health check OK',
      trace_id: span.spanContext().traceId,
      span_id: span.spanContext().spanId,
      timestamp: new Date().toISOString(),
    }));

    res.status(200).json({ status: 'ok' }); // ✅ explicit
  });
});

// ── GET /orders ─────────────────────────────────────────
app.get('/orders', (req, res) => {
  const tracer = trace.getTracer('orders-service');
  const span = tracer.startSpan('fetch-orders');

  context.with(trace.setSpan(context.active(), span), () => {

    if (req.query.fail === 'true') {
      const err = new Error('Simulated failure — orders service unavailable');

      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      span.end();

      console.error(JSON.stringify({
        level: 'ERROR',
        message: err.message,
        trace_id: span.spanContext().traceId,
        span_id: span.spanContext().spanId,
        timestamp: new Date().toISOString(),
      }));

      return res.status(500).json({ error: err.message }); // ✅ handled here
    }

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    console.log(JSON.stringify({
      level: 'INFO',
      message: 'Orders fetched successfully',
      trace_id: span.spanContext().traceId,
      span_id: span.spanContext().spanId,
      timestamp: new Date().toISOString(),
    }));

    res.status(200).json(orders);
  });
});

// ── Start Server ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});