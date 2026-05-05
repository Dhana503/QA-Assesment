// tracing.js — loaded FIRST before anything else via --require ./tracing.js

const { NodeTracerProvider }          = require('@opentelemetry/sdk-trace-node');
const { MeterProvider }               = require('@opentelemetry/sdk-metrics');
const { PrometheusExporter }          = require('@opentelemetry/exporter-prometheus');
const { Resource }                    = require('@opentelemetry/resources');
const { OTLPTraceExporter }           = require('@opentelemetry/exporter-trace-otlp-http');
const { BatchSpanProcessor }          = require('@opentelemetry/sdk-trace-node');
const { registerInstrumentations }    = require('@opentelemetry/instrumentation');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { metrics, trace }              = require('@opentelemetry/api');
const {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} = require('@opentelemetry/semantic-conventions');

// ── Resource ──────────────────────────────────────────────────────────────────
const resource = new Resource({
  [SEMRESATTRS_SERVICE_NAME]:           'orders-service',
  [SEMRESATTRS_SERVICE_VERSION]:        '1.0.0',
  [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: 'local',
});

// ── Trace Provider ────────────────────────────────────────────────────────────
const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
});

const tracerProvider = new NodeTracerProvider({ resource });
tracerProvider.addSpanProcessor(new BatchSpanProcessor(traceExporter));
tracerProvider.register();
trace.setGlobalTracerProvider(tracerProvider);

// ── Prometheus Exporter (view metrics in browser at port 9464) ────────────────
const prometheusExporter = new PrometheusExporter(
  { port: 9464, startServer: true },
  () => console.log(' Metrics available at http://localhost:9464/metrics')
);

// ── Metric Provider ───────────────────────────────────────────────────────────
const meterProvider = new MeterProvider({
  resource,
  readers: [prometheusExporter],
});

metrics.setGlobalMeterProvider(meterProvider);

// ── Manual Metrics ────────────────────────────────────────────────────────────
const meter = metrics.getMeter('orders-service', '1.0.0');

const httpRequestCounter = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests',
});

const httpRequestDuration = meter.createHistogram('http_request_duration_ms', {
  description: 'Duration of HTTP requests in milliseconds',
  unit: 'ms',
});

const heapUsed = meter.createObservableGauge('nodejs_heap_size_used_bytes', {
  description: 'Process heap size used in bytes',
});
heapUsed.addCallback((result) => {
  result.observe(process.memoryUsage().heapUsed);
});

const heapTotal = meter.createObservableGauge('nodejs_heap_size_total_bytes', {
  description: 'Process heap size total in bytes',
});
heapTotal.addCallback((result) => {
  result.observe(process.memoryUsage().heapTotal);
});

const cpuUser = meter.createObservableCounter('process_cpu_user_seconds_total', {
  description: 'Total user CPU time in seconds',
});
cpuUser.addCallback((result) => {
  result.observe(process.cpuUsage().user / 1e6);
});

// Export for use in server.js
module.exports = { httpRequestCounter, httpRequestDuration };

// ── Auto Instrumentations ─────────────────────────────────────────────────────
registerInstrumentations({
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
  tracerProvider,
  meterProvider,
});

console.log(' OpenTelemetry SDK started — service: orders-service');

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  await tracerProvider.shutdown();
  await meterProvider.shutdown();
  console.log(' OTel SDK shut down cleanly');
});