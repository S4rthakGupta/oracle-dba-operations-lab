# Enterprise Oracle features: study notes

**These are study notes, not hands-on experience.** None of these were built in this lab (single instance, Docker, laptop). They are here to show I understand what each feature is for and how it differs from the others.

## Quick comparison

| Feature | Protects against / gives you | Copies of the data | Where it runs |
|---|---|---|---|
| **RAC** | Server (node) failure, more processing power | One database, shared storage | Several instances on several servers, same site |
| **ASM** | Storage management, disk-level mirroring and striping | Mirrors inside disk groups | Oracle's own volume manager and file system |
| **Data Guard** | Site disaster, data corruption, planned maintenance | A separate standby database kept in sync | Primary site plus standby site |
| **GoldenGate** | Moving or sharing data between databases, near-zero-downtime migration | Replicated target(s), can be different versions or vendors | Separate replication processes |
| **Exadata** | Performance and consolidation | Not a copy feature | Oracle's engineered hardware platform |

## RAC (Real Application Clusters)
- **What:** several instances, each on its own server (node), open **one shared database** on shared storage.
- **Why:** high availability (if a node fails, the others keep serving) and scalability (spread the load).
- **Key terms:** Cache Fusion (nodes ship data blocks to each other over a private interconnect), Grid Infrastructure and clusterware, SCAN (single client access name), services, node eviction.
- **Limit:** the shared storage is still a single point of failure and RAC alone is not disaster recovery. Pair it with Data Guard.
- **Licensing note:** an Enterprise Edition option. From 19c, Standard Edition 2 no longer supports RAC.
- **Background processes (recall):** LMON, LMD, LMS, LCK.
- **One-liner:** "RAC runs multiple instances against one shared database for availability and scaling, but it does not protect against losing the storage or the site."

## ASM (Automatic Storage Management)
- **What:** Oracle's volume manager and file system for database files. Disks are grouped into **disk groups**.
- **Why:** simpler and faster than file systems plus a separate volume manager. Stripes and mirrors automatically, rebalances when disks are added or removed.
- **Redundancy levels:** external (no ASM mirroring, the storage array does it), normal (two-way mirror), high (three-way mirror).
- **Key terms:** ASM instance, disk group, failure group, `asmcmd`. It runs under Grid Infrastructure.
- **One-liner:** "ASM manages disks for Oracle directly, with striping and mirroring in disk groups, instead of using a separate file system."

## Data Guard
- **What:** one **primary** database and one or more **standby** databases, kept in sync by shipping and applying redo.
- **Types:** physical standby (redo apply, an exact block copy), logical standby (SQL apply), snapshot standby (opened read-write temporarily).
- **Protection modes:** Maximum Performance (asynchronous), Maximum Availability (synchronous, falls back if the standby is unreachable), Maximum Protection (synchronous, stops the primary if it cannot reach a standby).
- **Switchover vs failover:** switchover is a planned role swap with no data loss. Failover is an unplanned promotion of the standby after the primary is lost.
- **Tools:** Data Guard Broker (`DGMGRL`), Fast-Start Failover with an observer. **Active Data Guard** (licensed) lets the standby be open read-only while applying redo.
- **Key processes:** redo transport (LNS/NSA), RFS on the standby, MRP applying redo.
- **One-liner:** "Data Guard keeps a standby copy in sync with redo, for disaster recovery. Switchover is planned, failover is unplanned."

## GoldenGate
- **What:** logical, log-based replication. It reads changes from the redo logs and replays them on a target as SQL-level operations.
- **Parts:** **Extract** captures changes, **trail files** store them, **Replicat** applies them on the target (a data pump process can ship trails between sites).
- **Why:** heterogeneous replication (different Oracle versions, or other databases), real-time data feeds, bidirectional replication, near-zero-downtime migrations and upgrades.
- **Difference from Data Guard:** Data Guard copies the whole database physically for DR. GoldenGate replicates selected data logically and the target is usable and writable.
- **Licensing:** a separately licensed product.
- **One-liner:** "GoldenGate captures changes from the redo and applies them to a target database, which can be a different version or platform."

## Exadata
- **What:** Oracle's engineered system: database servers, **storage servers** and a fast internal network, tuned together.
- **Key features:** **Smart Scan** (storage servers filter rows and columns before sending data), storage indexes, flash cache, Hybrid Columnar Compression.
- **Typical use:** large databases, mixed workloads and consolidation, often running RAC on top.
- **One-liner:** "Exadata pushes SQL filtering down to the storage servers, so far less data crosses the network."

## How they combine in a typical enterprise
RAC (node failure) + ASM (storage) at the primary site, Data Guard to a second site (disaster recovery), GoldenGate where data must be shared or migrated, and Exadata where the performance requirement justifies the hardware. RMAN backups are still needed on top of all of it.

## What I would say about my own experience
"I have worked hands-on with a single-instance Oracle lab: ARCHIVELOG, RMAN backup and recovery, security and monitoring. RAC, ASM, Data Guard, GoldenGate and Exadata I know at the concept level and would learn on the job."
