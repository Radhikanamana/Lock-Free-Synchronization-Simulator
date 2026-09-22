# Lock-Free Synchronization Simulator

An interactive web application that visually demonstrates how lock-free synchronization techniques work in modern multiprocessor systems.

---

## How to Run

1. Open the project folder in VS Code
2. Open `index.html`
3. Right-click → **Open with Live Server** (or just double-click the file in your file explorer)

No installation, no dependencies, no build step required.

---

## Project Structure

```
lock-free-simulator/
│
├── index.html          ← Main page (HTML structure)
├── css/
│   └── style.css       ← All styling (dark theme, animations, layout)
├── js/
│   └── simulator.js    ← All simulation logic (CAS, mutex, race)
└── README.md           ← This file
```

---

## Features

| Feature | Description |
|--------|-------------|
| **Lock-free (CAS) mode** | Threads use Compare-And-Swap to atomically update the counter |
| **Mutex mode** | Only one thread enters the critical section at a time |
| **Race condition mode** | No synchronization — shows lost updates and data inconsistency |
| **Live CAS panel** | Shows expected, current, and new values for each atomic attempt |
| **Thread state colors** | Blue = running, Green = success, Red = failed/retry, Yellow = waiting |
| **Operation log** | Timestamped log of every read, write, CAS success/failure |
| **Statistics** | Total ops, CAS retries, lost updates, current mode |
| **Throughput bars** | Compare mutex vs lock-free operations across your session |
| **Speed control** | Adjust simulation speed from 1× (slow, for teaching) to 5× (fast) |
| **Add/Remove threads** | Dynamically add up to 6 threads or reduce to 1 |
| **Education cards** | Explanations of atomic ops, CAS, mutex, race conditions, deadlock |

---

## Concepts Demonstrated

### Compare-And-Swap (CAS)
```
IF memory[addr] == expected
    memory[addr] = new_value   → SUCCESS
ELSE
    retry                      → FAILURE
```
CAS is an atomic CPU instruction. If another thread changed the value between your read and your write, CAS detects it and the thread retries — no lock needed.

### Mutex
Only one thread holds the lock at a time. All others block (wait in queue). Guarantees correctness but can cause contention and performance bottlenecks under high thread counts.

### Race Condition
Without synchronization, two threads can read the same value, both increment it, and one write overwrites the other. The counter ends up lower than expected — this is a **lost update**.

---

## Technologies Used

- HTML5
- CSS3 (CSS Variables, transitions, responsive grid)
- Vanilla JavaScript (no libraries, no frameworks)

---

## Learning Outcomes

After exploring this simulator you should understand:

- Why race conditions happen and how to detect them
- How CAS achieves synchronization without blocking
- The difference between mutex (blocking) and lock-free (non-blocking) approaches
- Performance tradeoffs between locking and non-blocking synchronization
- Why lock-free algorithms tend to have higher throughput under contention

---

## Real-World Applications

Lock-free synchronization is used in:
- Linux Kernel (atomic operations in scheduling)
- Database engines (lock-free indexes, MVCC)
- Multiplayer game servers (concurrent state updates)
- High-frequency trading systems (ultra-low latency counters)
- Java's `java.util.concurrent` and C++'s `std::atomic`
