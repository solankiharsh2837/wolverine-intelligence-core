# Wolverine Intelligence - Network Adapters Specification

This document defines the `NetworkAdapter` interface and outlines the specific implementations and semantic constraints for each supported network within the Wolverine Intelligence platform.

> [!IMPORTANT]
> **Network semantics must be respected.** You cannot force ZeroNet or Freenet into a generic HTTP crawler model. Each adapter encapsulates the unique routing, discovery, and transport mechanisms of its respective network.

## 1. NetworkAdapter Interface Contract

All adapters MUST implement this exact interface to ensure the Collection Core can orchestrate tasks uniformly.

```typescript
enum NetworkType {
  TOR = 'TOR',
  I2P = 'I2P',
  ZERONET = 'ZERONET',
  FREENET = 'FREENET',
  CLEARNET = 'CLEARNET',
  DATASET = 'DATASET'
}

interface NetworkAdapter {
  networkType: NetworkType;
  
  // Yields newly discovered portals/services from directories or network probing
  discover(): AsyncIterator<PortalDescriptor>;
  
  // Establishes context/circuit/tunnel to the target portal
  connect(portal: PortalDescriptor): Connection;
  
  // Retrieves specific target artifacts
  collect(connection: Connection, target: CollectionTarget): Artifact[];
  
  // Maps out available content within the portal
  enumerate(connection: Connection): ContentIterator;
  
  // Generates canonical observations from a raw artifact
  observe(artifact: Artifact): Observation[];
  
  // Transforms raw network-specific data into the unified canonical payload
  normalize(rawData: any): CanonicalPayload;
  
  // Validates proxy/node health and connectivity
  healthCheck(): AdapterHealth;
  
  // Declares what this adapter can and cannot do
  getCapabilities(): AdapterCapabilities;
}
```

## 2. Per-Adapter Specifications

### TorAdapter (`collection/tor/`)
- **Service discovery**: Onion service enumeration, scraping known directory sources (e.g., TorLinks, Hidden Wiki variants).
- **Connection**: SOCKS5 proxy through a local Tor instance. Onion routing encapsulation.
- **Content**: Application-level HTTP/HTTPS over Tor.
- **Service locator**: `.onion` addresses (v3).
- **Collection semantics**: Standard web scraping through a Tor circuit. 
- **Rate limiting**: Per-circuit, per-service. Circuits must be rotated upon HTTP 429 or 403 blocks.
- **Error handling**: Circuit build failures, rendezvous point failures, service unavailability (503/504).
- **Test site integration**: Interacts with local `.onion` services hosted in `sites/tor/*`.

### I2PAdapter (`collection/i2p/`)
- **Service discovery**: I2P destination and service identity harvesting, address book subscriptions.
- **Connection**: I2P tunnel/proxy interfaces (HTTP proxy, SAM bridge for raw streams).
- **Content**: HTTP over I2P tunnels, direct I2P-specific protocols (e.g., I2P-Bote, I2P-Snark).
- **Service locator**: `.i2p` addresses, Base64 destinations.
- **Collection semantics**: Garlic routing via unidirectional tunnels. Latency is highly variable.
- **Rate limiting**: Tunnel-aware. Must manage inbound/outbound tunnel capacity.
- **Error handling**: Tunnel creation failures, leaseset expiration, destination offline.
- **Test site integration**: Interacts with local eepsites hosted in `sites/i2p/*`.

### ZeroNetAdapter (`collection/zeronet/`)
- **Service discovery**: Site address lookup, scraping known site lists and trackers.
- **Connection**: ZeroNet local node API (UiServer), WebSocket interface.
- **Content**: `content.json` manifests, cryptographically signed content, static files.
- **Service locator**: Site addresses (Bitcoin-style Base58 addresses).
- **Collection semantics**: NOT HTTP crawling. Content is downloaded/synced via a BitTorrent-like P2P protocol. The adapter syncs the site locally and reads the resulting files.
- **Content verification**: Cryptographic signatures validated against the site address. Content hashes validated against `content.json`.
- **Rate limiting**: Peer-based connections.
- **Error handling**: Peer unavailability, content verification failure (signature mismatch).
- **Test site integration**: Syncs local zites configured in `sites/zeronet/*`.

### FreenetAdapter (`collection/freenet/`)
- **Service discovery**: Node/application/contract-oriented lookup, spidering Freenet indexes.
- **Connection**: FCP (Freenet Client Protocol) connecting to a local Freenet node API.
- **Content**: Immutable content (CHK), mutable content (SSK/USK).
- **Service locator**: Freenet keys (`CHK@`, `SSK@`, `USK@`).
- **Collection semantics**: Content-addressed storage, insert/retrieve model. No direct connections to servers; data is requested from the local node's datastore or routed over the network.
- **Rate limiting**: Request-based local node queue management.
- **Error handling**: Data Not Found (DNF), timeout, route failure.
- **Test site integration**: Interacts with local freesites hosted in `sites/freenet/*`.

### ClearnetAdapter (`collection/clearnet/`)
- **Service discovery**: Standard DNS, web crawling, OSINT feeds.
- **Connection**: Direct HTTP/HTTPS, standard TLS.
- **Content**: HTML, JSON API endpoints, paste sites.
- **Service locator**: Standard URLs, Domains, IP Addresses.
- **Collection semantics**: Standard HTTP client (e.g., Axios/Playwright).
- **Rate limiting**: Standard per-domain delays, obeying `robots.txt`.
- **Use cases**: Paste sites (Pastebin), leak forums operating on clearnet, PGP keyservers, blockchain explorers.

### DatasetAdapter (`collection/datasets/`)
- **Note**: Not a traditional network adapter; operates on file-based ingestion.
- **Function**: Loads registered datasets from local disk or cloud blob storage.
- **Transformation**: Transforms dataset records into the canonical model using schema maps.
- **Provenance**: Maintains strict dataset provenance (see [DATASETS.md](DATASETS.md)).

## 3. Adapter Capabilities Matrix

| Capability | Tor | I2P | ZeroNet | Freenet | Clearnet | Dataset |
|---|---|---|---|---|---|---|
| Real-time discovery | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| HTTP Semantics | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| Content verification | ✗ | ✗ | ✓ (signatures) | ✓ (content-addressed) | ✗ | ✗ |
| P2P Transport | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ |
| Anonymity routing | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| Batch ingestion | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |

## 4. Network Semantic Differences (CRITICAL)

> [!WARNING]
> Do not attempt to abstract away network routing into a generic HTTP interface.

- **Tor**: Uses Onion Routing and hidden services. It relies heavily on SOCKS proxies. The adapter must handle Tor-specific concepts like circuit exhaustion and rendezvous point failures.
- **I2P**: Uses Garlic Routing and unidirectional tunnels. It is message-based underneath. The adapter must interact with the SAM bridge or I2P HTTP proxies, handling lease-set dynamics.
- **ZeroNet**: Is a P2P content distribution network. Sites are downloaded entirely (or partially based on rules). There is no central server to send HTTP requests to. The adapter acts as a ZeroNet node, syncing content and validating signatures locally.
- **Freenet**: Is a distributed, content-addressed datastore. There are no direct connections. The adapter submits retrieve requests for specific keys (CHK/SSK/USK) via the FCP protocol and waits asynchronously for the node to assemble the blocks.

## 5. Common Normalization

Regardless of how raw artifacts are obtained (an HTTP response body via Tor, a synced JSON file via ZeroNet, or an assembled file via Freenet), the output of the `collect()` method is a standard `Artifact`.

The `normalize()` and `observe()` methods apply uniform logic:
1. Identify the MIME type or structure of the Artifact.
2. Execute the appropriate parser (e.g., HTML Forum Parser, JSON Manifest Parser).
3. Generate standard Observations (`AUTHORSHIP`, `MENTION`, `LISTING`) representing the canonical facts.

## 6. Adapter Versioning

Each adapter maintains its own semantic version number, which is inextricably linked to the observations it produces.
- Tracked via `collectorVersion` in the observation metadata.
- If an adapter's logic changes (e.g., upgrading from FCPv2 to FCPv3 for Freenet, or updating Tor circuit handling), the version MUST be bumped.
- This ensures any anomalies in data collection can be isolated to a specific adapter version.
