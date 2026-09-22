# Lock-Free-Synchronization-Simulator
The Lock-Free Synchronization Simulator is an interactive educational tool designed to demonstrate how multiple threads safely access shared resources without using traditional locking mechanisms such as mutexes and semaphores. 
# 🔒 Lock-Free Synchronization Simulator

An interactive browser-based educational tool for understanding **thread synchronization, race conditions, atomic operations, mutexes, semaphores, monitors, and deadlock prevention** through real-time visual simulations.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔢 **Counting Semaphore** | Simulates resource management using configurable semaphore slots and concurrent thread access. |
| 🔐 **Mutex Lock** | Demonstrates mutual exclusion by allowing only one thread to enter a critical section at a time. |
| ⚡ **Compare-and-Swap (CAS)** | Visualizes atomic CAS operations used in lock-free synchronization. |
| ⚠️ **Race Condition** | Demonstrates how simultaneous access to shared resources can produce inconsistent results. |
| 📦 **Bounded Buffer Monitor** | Simulates the Producer-Consumer problem using a synchronized shared buffer. |
| 🍽️ **Dining Philosophers** | Demonstrates synchronization, resource sharing, and deadlock prevention. |
| 🔄 **FIFO Wake Order** | Shows how waiting threads are released in first-in-first-out order. |
| 🛡️ **Deadlock Prevention** | Uses back-off strategies to demonstrate techniques for avoiding deadlocks. |
| 📊 **Real-Time Visualization** | Displays thread states such as Running, Waiting, Blocked, and Completed. |
| 🎮 **Interactive Controls** | Provides Start, Pause, Reset, and configuration controls for simulations. |
| 👣 **Step-by-Step Execution** | Allows users to observe synchronization operations one step at a time. |
| 🌐 **Browser-Based** | Runs directly in the browser without requiring a backend server. |
| 🔄 **Reset & Replay** | Allows simulations to be restarted and executed repeatedly. |

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 |
| **Build Tool** | Vite 5 |
| **Styling** | Tailwind CSS |
| **Language** | JavaScript / JSX |
| **Architecture** | Single Page Application (SPA) |
| **Simulation Engine** | JavaScript-based synchronization engine |
| **State Management** | React `useState` and `useRef` |
| **Backend** | Not Required |

---

## 📁 Project Structure

```text
Lock-Free-Synchronization-Simulator/
│
├── src/
│   ├── components/
│   │   ├── Semaphore.jsx          # Counting Semaphore simulation
│   │   ├── Mutex.jsx              # Mutex Lock simulation
│   │   ├── Monitor.jsx            # Producer-Consumer simulation
│   │   ├── DiningPhilosophers.jsx # Dining Philosophers simulation
│   │   ├── CAS.jsx                # Compare-and-Swap visualization
│   │   └── ThreadVisualizer.jsx   # Thread state visualization
│   │
│   ├── simulation/
│   │   ├── semaphore.js           # Semaphore logic
│   │   ├── mutex.js               # Mutex logic
│   │   ├── monitor.js             # Monitor logic
│   │   └── philosophers.js        # Dining Philosophers logic
│   │
│   ├── App.jsx                    # Main application
│   ├── main.jsx                   # Application entry point
│   └── index.css                  # Global styling
│
├── public/
│
├── package.json                   # Project dependencies
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind configuration
└── README.md                      # Project documentation
🎯 Modules
🔢 Counting Semaphore

Demonstrates how semaphores control access to a limited number of shared resources.

🔐 Mutex

Demonstrates mutual exclusion and prevents multiple threads from entering a critical section simultaneously.

📦 Monitor – Bounded Buffer

Visualizes the Producer-Consumer problem using a bounded buffer and synchronized access.

🍽️ Dining Philosophers

Demonstrates resource sharing between concurrent processes and techniques for preventing deadlock.

⚡ Compare-and-Swap

Demonstrates atomic operations used by lock-free algorithms to update shared data safely.

🧠 Learning Objectives
Understand thread synchronization concepts.
Identify and visualize race conditions.
Understand the working of mutexes and semaphores.
Learn how atomic CAS operations work.
Understand the Producer-Consumer problem.
Understand the Dining Philosophers problem.
Learn about deadlock and deadlock prevention.
Visualize different thread execution states.
Understand synchronization through interactive simulations.
🌟 Key Highlights
🎓 Educational: Designed for Operating Systems learning and laboratory demonstrations.
🎮 Interactive: Users can control and observe simulations.
📊 Visual: Thread states and synchronization events are displayed visually.
⚡ Real-Time: Simulation states update dynamically.
🌐 Browser-Based: No backend server is required.
🔄 Replayable: Simulations can be reset and executed multiple times.
💻 Lightweight: Runs locally in the browser.
👩‍💻 Author

Radhika

📌 Project: Lock-Free Synchronization Simulator

An Operating Systems project designed to visually demonstrate thread synchronization and concurrency concepts.
