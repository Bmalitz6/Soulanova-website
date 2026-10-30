import SwiftUI
import HealthKit
import CoreMotion

@MainActor
final class SoulWalkWorkout: ObservableObject {
    @Published var running = false
    @Published var seconds = 0
    @Published var steps: Int?
    @Published var miles: Double?
    @Published var heartRate: Double?
    @Published var status = "Ready to walk"
    private let health = HKHealthStore()
    private let pedometer = CMPedometer()
    private var session: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?
    private var timer: Timer?
    private var started: Date?
    private var elapsedBeforePause: TimeInterval = 0

    func authorize() async {
        guard HKHealthStore.isHealthDataAvailable() else { status = "HealthKit is unavailable"; return }
        let types: Set<HKObjectType> = [
            HKObjectType.workoutType(),
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)!,
            HKObjectType.quantityType(forIdentifier: .stepCount)!
        ]
        do {
            try await health.requestAuthorization(toShare: [HKObjectType.workoutType()], read: types)
            status = "Ready to walk"
        } catch { status = "Health access: \(error.localizedDescription)" }
    }

    func start() {
        guard !running else { return }
        if session == nil {
            do {
                let config = HKWorkoutConfiguration()
                config.activityType = .walking
                config.locationType = .outdoor
                let newSession = try HKWorkoutSession(healthStore: health, configuration: config)
                let newBuilder = newSession.associatedWorkoutBuilder()
                newBuilder.dataSource = HKLiveWorkoutDataSource(healthStore: health, workoutConfiguration: config)
                let startedAt = Date()
                newSession.startActivity(with: startedAt)
                newBuilder.beginCollection(withStart: startedAt) { _, _ in }
                session = newSession
                builder = newBuilder
                started = startedAt
                elapsedBeforePause = 0
                beginPedometer(from: startedAt)
                status = "Workout recording"
            } catch { status = "Could not start: \(error.localizedDescription)"; return }
        } else {
            session?.resume()
            started = Date()
            status = "Workout recording"
        }
        running = true
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in self?.tick() }
        }
    }

    private func beginPedometer(from date: Date) {
        guard CMPedometer.isStepCountingAvailable() else { status = "Step sensor unavailable"; return }
        pedometer.startUpdates(from: date) { [weak self] result, _ in
            Task { @MainActor in
                guard let self, let result else { return }
                self.steps = result.numberOfSteps.intValue
                if let meters = result.distance?.doubleValue { self.miles = meters / 1609.344 }
            }
        }
    }

    private func tick() {
        if let started { seconds = Int(elapsedBeforePause + Date().timeIntervalSince(started)) }
        if let stats = builder?.statistics(for: HKQuantityType.quantityType(forIdentifier: .heartRate)!) {
            heartRate = stats.mostRecentQuantity()?.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
        }
    }

    func pause() {
        guard running else { return }
        if let started { elapsedBeforePause += Date().timeIntervalSince(started) }
        started = nil
        session?.pause()
        running = false
        timer?.invalidate()
        seconds = Int(elapsedBeforePause)
        status = "Paused"
    }

    func finish() {
        if running { pause() }
        session?.end()
        if let builder {
            builder.endCollection(withEnd: Date()) { _, _ in
                builder.finishWorkout { _, _ in }
            }
        }
        pedometer.stopUpdates()
        session = nil
        self.builder = nil
        started = nil
        elapsedBeforePause = 0
        status = "Workout finished"
    }
}

struct SoulWalkWatchView: View {
    @StateObject private var workout = SoulWalkWorkout()
    private let teal = Color(red: 0.15, green: 0.81, blue: 0.69)

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                Text("SOULWALK").font(.caption2.weight(.bold)).tracking(2).foregroundStyle(teal)
                Text(String(format: "%02d:%02d", workout.seconds / 60, workout.seconds % 60))
                    .font(.system(size: 36, weight: .bold, design: .rounded)).monospacedDigit()
                HStack {
                    metric("DISTANCE", workout.miles.map { String(format: "%.2f mi", $0) } ?? "—")
                    metric("STEPS", workout.steps.map(String.init) ?? "—")
                }
                metric("HEART RATE", workout.heartRate.map { "\(Int($0)) bpm" } ?? "—")
                Text(workout.status).font(.caption2).foregroundStyle(.secondary).multilineTextAlignment(.center)
                if workout.running {
                    Button("Pause") { workout.pause() }.tint(.orange)
                } else {
                    Button(workout.seconds > 0 ? "Resume" : "Start Walk") { workout.start() }.tint(teal)
                }
                if workout.seconds > 0 && !workout.running {
                    Button("Finish") { workout.finish() }.tint(.red)
                }
            }.padding(.horizontal, 8)
        }
        .task { await workout.authorize() }
    }

    private func metric(_ label: String, _ value: String) -> some View {
        VStack(spacing: 3) {
            Text(label).font(.system(size: 9, weight: .bold)).foregroundStyle(.secondary)
            Text(value).font(.headline.monospacedDigit()).minimumScaleFactor(0.7).lineLimit(1)
        }.frame(maxWidth: .infinity).padding(8).background(.white.opacity(0.09), in: RoundedRectangle(cornerRadius: 12))
    }
}
