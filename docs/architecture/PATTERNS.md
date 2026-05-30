# Cloud Architecture Patterns

## Microservices Architecture

```
┌─────────────┐
│   API       │
│  Gateway    │
└────┬────────┘
     │
     ├─────────┬──────────┬──────────┐
     ↓         ↓          ↓          ↓
  ┌─────┐  ┌─────┐   ┌─────┐   ┌─────┐
  │Auth │  │User │   │Order│   │Pay  │
  │Svc  │  │Svc  │   │Svc  │   │Svc  │
  └──┬──┘  └──┬──┘   └──┬──┘   └──┬──┘
     │        │         │        │
  ┌──┴────────┴─────────┴────────┴──┐
  │  Message Bus / Event Streaming   │
  └────────────────────────────────┘
     │
  ┌──┴────────────────────────┐
  │  Shared Data Layer        │
  │  - Databases              │
  │  - Cache (Redis)          │
  │  - Object Storage         │
  └───────────────────────────┘
```

### Key Principles:
- Single responsibility
- Autonomous deployment
- Technology heterogeneity
- Decentralized data
- Observable systems

## Container Orchestration

**Kubernetes Deployment Pattern:**
```yaml
Nodes (Worker Machines)
  ├── Pod (User Service)
  │   └── Container
  ├── Pod (Order Service)
  │   ├── Container
  │   └── Sidecar
  └── Pod (Payment Service)
      └── Container

Services:
  ├── ClusterIP (Internal)
  ├── NodePort (External)
  └── LoadBalancer (Cloud LB)

Persistent Storage:
  ├── ConfigMap
  ├── Secrets
  └── PersistentVolume
```

## Serverless Architecture

**Event-Driven Model:**
```
Event Source
  (S3, API Gateway, Schedule)
    ↓
  Trigger
    ↓
Lambda/Cloud Function
    ↓
  Execution
    ↓
Managed Services
  (Database, Storage, Queue)
```

## API Gateway Pattern

```
┌─────────┐
│ Clients │
└────┬────┘
     │
  ┌──┴──────────────────┐
  │   API Gateway       │
  │ - Rate Limiting     │
  │ - Auth/AuthZ        │
  │ - Request Transform │
  └─────────┬───────────┘
            │
     ┌──────┼──────┐
     ↓      ↓      ↓
  Svc1   Svc2   Svc3
```

## Service Mesh Pattern

```
Application Pods
  ↓
Envoy Sidecars (Data Plane)
  ├── Service-to-Service Communication
  ├── Load Balancing
  ├── Circuit Breaking
  └── Observability
  ↓
Control Plane (Istio/Linkerd)
  ├── Configuration
  ├── Service Discovery
  ├── Policy Enforcement
  └── Telemetry
```

## CQRS Pattern

```
Command Side          Query Side
  │                      ↓
  ├─→ Write Models ────→ Event Store
  │                      ↓
  │                 Read Models
  │                      ↓
  └─────────────────────Queries
```

## Migration Architecture Pattern

```
Hybrid Setup During Migration

On-Premises          Cloud
    ├─────────────────┤
    │   VPN/Tunnel    │
    │                 │
┌─────────┐      ┌─────────┐
│ Legacy  │      │ Modern  │
│ Systems │◄────►│ Systems │
└────┬────┘      └────┬────┘
     │                │
     └────Replication─┘
            ↓
        Data Sync
```

## Security Pattern: Zero Trust

```
┌──────────────────────────────┐
│  Every Request Authenticated │
│  Every Service Authorized    │
│  All Traffic Encrypted       │
└──────────────────────────────┘
     │
     ├── Identity Verification
     ├── Device Health Check
     ├── Encryption (TLS)
     ├── Network Segmentation
     └── Continuous Monitoring
```