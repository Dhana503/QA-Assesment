# 🚀 orders-service — OpenTelemetry QA Validation

This repo contains my QA assignment where I validated **OpenTelemetry instrumentation** on a Node.js (Express) service.

The focus here is not building features, but checking whether observability is implemented correctly — **traces, metrics, and logs all working together**.

---

## 🧠 What this is about

I tested whether:

* Each request generates a proper trace
* Metrics are exposed and updating correctly
* Logs are correlated with trace context
* The system behaves properly when telemetry fails

---

## 🛠️ Stack

* Node.js
* Express
* OpenTelemetry
* Prometheus

---

## 🔗 Endpoints

* `/health` → returns service status
* `/orders` → returns orders list
* `/orders?fail=true` → simulates failure

---

## ⚙️ Run locally

```bash
npm install
npm start
```

App → http://localhost:3000
Metrics → http://localhost:9464/metrics

---

## 🔍 What I validated

### ✔ Basic functionality

* App starts without errors
* All endpoints respond correctly

---

### ✔ Traces

* Verified `trace_id`, `span_id`
* Checked success and failure flows
* Ensured each request has a unique trace

---

### ✔ Metrics

* Observed HTTP metrics and runtime stats
* Verified data via Prometheus endpoint

---

### ✔ Logs

* Logs include `trace_id` and `span_id`
* Able to correlate logs with traces

---

### ✔ Failure scenarios

* Simulated exporter failures
* Confirmed app does not crash
* Telemetry fails gracefully

---

## 🐞 Issues faced

* OpenTelemetry version conflicts
* Exporter version mismatch
* Port already in use

---

## 💡 Improvements

* Add alerting for telemetry failures
* Buffer spans during collector downtime
* Automate validation
* Add CI/CD observability checks

---

## 📌 Conclusion

OpenTelemetry setup is working correctly across traces, metrics, and logs.
The system is stable even when telemetry components fail.

---

## 👤 Author

Dhana Sridhar S
