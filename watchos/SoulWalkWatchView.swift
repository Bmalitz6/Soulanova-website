import SwiftUI
import Combine
import HealthKit
import CoreMotion
import WatchKit

@MainActor
final class SoulWalkWorkout: NSObject, ObservableObject {
    enum State: String {
        case ready = "Ready"
        case starting = "Starting…"
        case active = "Active"
        case pausing = "Pausing…"
        case paused = "Paused"
        case resuming = "Resuming…"
        case finishing = "Finishing…"
        case completed = "Completed"
    }

    @Published private(set) var state: State = .ready
    @Published private(set) var cleaningUp = false
    @Published private(set) var seconds = 0
    @Published private(set) var steps: Int?
    @Published private(set) var miles: Double?
    @Published private(set) var heartRate: Double?
    @Published private(set) var status = "Ready to walk"
    private let health = HKHealthStore()
    private let pedometer = CMPedometer()
    private var session: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?
    private var timer: Timer?
    private var started: Date?
    private var elapsedBeforePause: TimeInterval = 0
    private var collectionReady = false
    private var finalizing = false
    private var finishRequested = false
    private var workoutID = UUID()

    func start() async {
        guard state == .ready || state == .completed else { return }
        guard session == nil, builder == nil else { return }
        state = .starting
        status = "Requesting Health access…"
        do {
            guard HKHealthStore.isHealthDataAvailable() else {
                throw WorkoutError.unavailable
            }
            let types: Set<HKObjectType> = [
                HKObjectType.workoutType(),
                HKObjectType.quantityType(forIdentifier: .heartRate)!,
                HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)!,
                HKObjectType.quantityType(forIdentifier: .stepCount)!
            ]
            try await health.requestAuthorization(toShare: [HKObjectType.workoutType()], read: types)
            guard health.authorizationStatus(for: HKObjectType.workoutType()) == .sharingAuthorized else {
                throw WorkoutError.permission
            }
            let config = HKWorkoutConfiguration()
            config.activityType = .walking
            config.locationType = .outdoor
            let newSession = try HKWorkoutSession(healthStore: health, configuration: config)
            let newBuilder = newSession.associatedWorkoutBuilder()
            newBuilder.dataSource = HKLiveWorkoutDataSource(healthStore: health, workoutConfiguration: config)
            newSession.delegate = self
            session = newSession
            builder = newBuilder
            collectionReady = false
            finalizing = false
            finishRequested = false
            workoutID = UUID()
            let id = workoutID
            let date = Date()
            status = "Starting HealthKit recording…"
            newSession.startActivity(with: date)
            // Session activation and collection are asynchronous. Both must succeed.
            newBuilder.beginCollection(withStart: date) { [weak self] success, error in
                Task { @MainActor [weak self] in
                    guard let self, self.workoutID == id, self.session === newSession,
                          self.state == .starting else { return }
                    guard success else {
                        self.fail("Could not start: \(error?.localizedDescription ?? "HealthKit collection failed")")
                        return
                    }
                    self.seconds = 0
                    self.steps = nil
                    self.miles = nil
                    self.heartRate = nil
                    self.elapsedBeforePause = 0
                    self.started = date
                    self.collectionReady = true
                    self.activateIfReady()
                }
            }
        } catch {
            fail("Could not start: \(error.localizedDescription)")
        }
    }

    private func activateIfReady() {
        guard state == .starting, collectionReady, session?.state == .running,
              let date = started else { return }
        state = .active
        status = "Workout recording"
        beginPedometer(from: date)
        startTimer()
    }

    func pause() {
        guard state == .active, collectionReady, session?.state == .running else { return }
        state = .pausing
        status = "Pausing…"
        session?.pause()
    }

    func resume() {
        guard state == .paused, collectionReady, session?.state == .paused else { return }
        state = .resuming
        status = "Resuming…"
        session?.resume()
    }

    func finish() {
        guard state == .active || state == .paused,
              collectionReady, let session else { return }
        guard session.state == .running || session.state == .paused else {
            fail("Could not save: the HealthKit session is no longer active.")
            return
        }
        freeze(at: Date())
        finishRequested = true
        state = .finishing
        status = "Saving to Apple Health…"
        if session.state == .paused {
            // end() is not valid for an inactive session. Resume before stopping;
            // keep the summary clock frozen throughout this transition.
            session.resume()
        } else {
            session.stopActivity(with: Date())
        }
    }

    private func finalize(at date: Date) {
        guard collectionReady, !finalizing, let session, let builder else { return }
        finalizing = true // One endCollection and one finishWorkout per builder.
        finishRequested = true
        freeze(at: date)
        state = .finishing
        status = "Saving to Apple Health…"
        let id = workoutID
        builder.endCollection(withEnd: date) { [weak self] success, error in
            Task { @MainActor [weak self] in
                guard let self, self.workoutID == id, self.builder === builder else { return }
                guard success else {
                    self.fail("Could not save: \(error?.localizedDescription ?? "HealthKit collection could not end")")
                    return
                }
                self.updateMetrics()
                builder.finishWorkout { [weak self] workout, error in
                    Task { @MainActor [weak self] in
                        guard let self, self.workoutID == id, self.builder === builder else { return }
                        if workout != nil {
                            self.complete(status: "Saved to Apple Health")
                        } else {
                            self.fail("Could not save: \(error?.localizedDescription ?? "HealthKit did not return a workout")")
                        }
                    }
                }
                // The stopped activity has finished collecting; release session mode.
                if session.state == .stopped { session.end() }
            }
        }
    }

    private func sessionChanged(_ session: HKWorkoutSession, to state: HKWorkoutSessionState, at date: Date) {
        guard self.session === session else { return }
        if self.state == .completed {
            if state == .running || state == .stopped {
                session.delegate = nil
                if session.state == .running || session.state == .stopped { session.end() }
                self.session = nil
                cleaningUp = false
            } else if state == .ended {
                session.delegate = nil
                self.session = nil
                cleaningUp = false
            }
            return
        }
        switch state {
        case .running:
            if finishRequested {
                if session.state == .running { session.stopActivity(with: Date()) }
            } else if self.state == .starting {
                activateIfReady()
            } else if collectionReady && (self.state == .resuming || self.state == .paused) {
                started = date
                self.state = .active
                status = "Workout recording"
                startTimer()
            }
        case .paused:
            if self.state == .starting {
                fail("Could not start: HealthKit paused before recording was ready.")
                return
            }
            guard !finishRequested else { return }
            freeze(at: date)
            self.state = .paused
            status = "Paused"
        case .stopped:
            guard collectionReady else {
                fail("Could not start: the HealthKit session stopped before collection began.")
                return
            }
            finalize(at: date)
        case .ended:
            if !finalizing {
                fail("Workout ended before it could be saved.")
            }
        default:
            break
        }
    }

    private func startTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self, self.state == .active || self.state == .pausing else { return }
                if let started = self.started {
                    self.seconds = Int(self.elapsedBeforePause + Date().timeIntervalSince(started))
                }
                self.updateMetrics()
            }
        }
    }

    private func freeze(at date: Date) {
        if let started { elapsedBeforePause += max(0, date.timeIntervalSince(started)) }
        started = nil
        seconds = Int(elapsedBeforePause)
        timer?.invalidate()
        timer = nil
        updateMetrics()
        if finishRequested || state == .active || state == .paused { pedometer.stopUpdates() }
    }

    private func updateMetrics() {
        guard let builder else { return }
        if let quantity = builder.statistics(for: HKQuantityType.quantityType(forIdentifier: .heartRate)!)?.mostRecentQuantity() {
            heartRate = quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
        }
        if let quantity = builder.statistics(for: HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)!)?.sumQuantity() {
            miles = quantity.doubleValue(for: .meter()) / 1609.344
        }
        if let quantity = builder.statistics(for: HKQuantityType.quantityType(forIdentifier: .stepCount)!)?.sumQuantity() {
            steps = Int(quantity.doubleValue(for: .count()))
        }
    }

    private func beginPedometer(from date: Date) {
        guard CMPedometer.isStepCountingAvailable() else { return }
        let id = workoutID
        pedometer.startUpdates(from: date) { [weak self] result, _ in
            Task { @MainActor [weak self] in
                guard let self, let result, self.workoutID == id, self.state == .active else { return }
                self.steps = result.numberOfSteps.intValue
                if let meters = result.distance?.doubleValue { self.miles = meters / 1609.344 }
            }
        }
    }

    private func fail(_ message: String) {
        // Retain summary metrics even when HealthKit fails. Never retry a save,
        // since a failed response may still follow a database write.
        builder?.discardWorkout()
        complete(status: message)
    }

    private func complete(status: String) {
        freeze(at: Date())
        pedometer.stopUpdates()
        // A paused session must first resume. Keep its delegate until that
        // transition arrives, so cleanup never calls end() on an inactive session.
        if let session, session.state == .paused || session.state == .notStarted || session.state == .prepared {
            cleaningUp = true
            if session.state == .paused { session.resume() }
        } else {
            cleaningUp = false
            session?.delegate = nil
            if let session, session.state == .running || session.state == .stopped { session.end() }
            session = nil
        }
        builder = nil
        collectionReady = false
        finalizing = false
        finishRequested = false
        workoutID = UUID() // Ignore late callbacks from the previous recording.
        state = .completed
        self.status = status
    }

    private enum WorkoutError: LocalizedError {
        case unavailable, permission
        var errorDescription: String? {
            switch self {
            case .unavailable: return "HealthKit is unavailable."
            case .permission: return "Allow SoulWalk to save workouts in Health permissions."
            }
        }
    }
}

extension SoulWalkWorkout: HKWorkoutSessionDelegate {
    nonisolated func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState,
                                    from fromState: HKWorkoutSessionState, date: Date) {
        Task { @MainActor [weak self] in
            self?.sessionChanged(workoutSession, to: toState, at: date)
        }
    }

    nonisolated func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
        Task { @MainActor [weak self] in
            guard let self, self.session === workoutSession else { return }
            // A failed session is invalid; do not send it another end command.
            workoutSession.delegate = nil
            self.session = nil
            self.cleaningUp = false
            self.fail("HealthKit workout failed: \(error.localizedDescription)")
        }
    }
}

struct SoulWalkWatchView: View {
    @StateObject private var workout = SoulWalkWorkout()
    @State private var showingMusic = false
    private let teal = Color(red: 0.15, green: 0.81, blue: 0.69)

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                Text("SOULWALK").font(.caption2.weight(.bold)).tracking(2).foregroundStyle(teal)
                Text(workout.state == .completed ? "Completed" : workout.state.rawValue)
                    .font(.headline)
                Text(String(format: "%02d:%02d", workout.seconds / 60, workout.seconds % 60))
                    .font(.system(size: 36, weight: .bold, design: .rounded)).monospacedDigit()
                HStack {
                    metric("DISTANCE", workout.miles.map { String(format: "%.2f mi", $0) } ?? "—")
                    metric("STEPS", workout.steps.map(String.init) ?? "—")
                }
                if workout.state != .completed || workout.heartRate != nil {
                    metric("HEART RATE", workout.heartRate.map { "\(Int($0)) bpm" } ?? "—")
                }
                Text(workout.status).font(.caption2).foregroundStyle(.secondary).multilineTextAlignment(.center)
                switch workout.state {
                case .ready:
                    Button("Start Walk") { Task { await workout.start() } }.tint(teal)
                case .active:
                    Button("Pause") { workout.pause() }.tint(.orange)
                case .paused:
                    Button("Resume") { workout.resume() }.tint(teal)
                    Button("Finish") { workout.finish() }.tint(.red)
                case .starting, .pausing, .resuming, .finishing:
                    ProgressView().accessibilityLabel(workout.state.rawValue)
                case .completed:
                    Button("Start New Walk") { Task { await workout.start() } }
                        .tint(teal)
                        .disabled(workout.cleaningUp)

                }
                Divider()
                Button {
                    showingMusic = true
                } label: {
                    Label("Music", systemImage: "music.note")
                        .font(.caption)
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
                .accessibilityHint("Opens Now Playing without changing your workout")
            }.padding(.horizontal, 8)
        }
        .sheet(isPresented: $showingMusic) {
            NowPlayingView()
        }
    }

    private func metric(_ label: String, _ value: String) -> some View {
        VStack(spacing: 3) {
            Text(label).font(.system(size: 9, weight: .bold)).foregroundStyle(.secondary)
            Text(value).font(.headline.monospacedDigit()).minimumScaleFactor(0.7).lineLimit(1)
        }.frame(maxWidth: .infinity).padding(8).background(.white.opacity(0.09), in: RoundedRectangle(cornerRadius: 12))
    }
}
