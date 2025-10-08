
/* UNO #1 — Smooth steppers: half-step + acceleration + pot sample/hold
 * Pins:
 *  M1 IN1..IN4 -> 2,3,4,5   (pot A0)
 *  M2 IN1..IN4 -> 6,7,8,9   (pot A1)
 *  M3 IN1..IN4 -> 10,11,12,13 (pot A2)
 */

/// ---- Tuning ----
const long  STEPS_PER_REV = 4096;          // 28BYJ-48 half-step (smoother)
const int   DEAD_BAND_STEPS = 4;           // ignore tiny error
const unsigned long BASE_STEP_US = 1200;   // slowest (start/stop) step interval
const unsigned long FAST_STEP_US = 700;    // fastest step interval (cruise)
const int   ACCEL_DISTANCE = 50;           // steps to ramp from BASE -> FAST
const unsigned long POT_STABLE_MS = 200;   // sample-and-hold time
const int   POT_JITTER = 4;                // ignore tiny pot movement
const float MAX_ANGLE_DEG[3] = {360, 360, 360};

/// ---- Pins ----
const uint8_t M_PINS[3][4] = {
  {2, 3, 4, 5},
  {6, 7, 8, 9},
  {10,11,12,13}
};
const uint8_t POT_PINS[3] = {A0, A1, A2};

/// ---- Half-step sequence (IN1..IN4) ----
/// 1000, 1100, 0100, 0110, 0010, 0011, 0001, 1001
const uint8_t SEQ8[8][4] = {
  {1,0,0,0}, {1,1,0,0}, {0,1,0,0}, {0,1,1,0},
  {0,0,1,0}, {0,0,1,1}, {0,0,0,1}, {1,0,0,1}
};

struct Motor {
  uint8_t p[4];
  uint8_t idx;              // 0..7 (half-step)
  long    cur;              // current position (steps)
  long    tgt;              // target position (steps)
  unsigned long lastUs;     // last step timestamp
  // ramp
  unsigned long stepIntervalUs; // current step interval (ramps toward FAST_STEP_US)

  // pot sample-and-hold
  int filt, prev, cmd;
  unsigned long lastChangeMs;
  bool movingPot;
};

Motor m[3];

inline long angleToSteps(float deg){ return (long)((deg / 360.0f) * STEPS_PER_REV); }

void setCoils(const Motor& mm){
  for (int c=0;c<4;c++) digitalWrite(mm.p[c], SEQ8[mm.idx][c]);
}

inline void stepFwd(Motor& mm){ mm.idx = (mm.idx + 1) & 7; setCoils(mm); mm.cur++; }
inline void stepRev(Motor& mm){ mm.idx = (mm.idx + 7) & 7; setCoils(mm); mm.cur--; }

// simple trapezoid: shrink interval as we get farther from start, grow near target
unsigned long computeInterval(long remainingAbs, unsigned long current){
  // accelerate for the first ACCEL_DISTANCE, cruise, then decelerate near target
  unsigned long targetInt = FAST_STEP_US;
  if (remainingAbs < ACCEL_DISTANCE) {
    // decelerate: interpolate toward BASE_STEP_US
    unsigned long span = BASE_STEP_US - FAST_STEP_US;
    targetInt = FAST_STEP_US + (span * (ACCEL_DISTANCE - remainingAbs)) / ACCEL_DISTANCE;
  }
  // gently slew current toward targetInt
  if (current > targetInt) current -= 10;
  else if (current < targetInt) current += 10;
  return current;
}

void serviceMotor(Motor& mm, unsigned long now){
  long err = mm.tgt - mm.cur;
  long aerr = labs(err);
  if (aerr <= DEAD_BAND_STEPS) return;

  // ramp interval toward required value
  mm.stepIntervalUs = computeInterval(aerr, mm.stepIntervalUs);

  if (now - mm.lastUs < mm.stepIntervalUs) return;

  (err > 0) ? stepFwd(mm) : stepRev(mm);
  mm.lastUs = now;
}

void updatePotAndCommit(Motor& mm, uint8_t i){
  int raw = analogRead(POT_PINS[i]);
  mm.filt = (mm.filt*3 + raw)/4;                 // small IIR smoothing

  if (abs(mm.filt - mm.prev) > POT_JITTER){
    mm.lastChangeMs = millis();
    mm.movingPot = true;
  }
  mm.prev = mm.filt;

  if (mm.movingPot && (millis() - mm.lastChangeMs >= POT_STABLE_MS)){
    mm.cmd = mm.filt;
    float angle = (mm.cmd / 1023.0f) * MAX_ANGLE_DEG[i];
    long tgt = angleToSteps(angle);

    // flip direction per motor if needed:
    // if (i==0) tgt = -tgt;

    mm.tgt = tgt;
    mm.movingPot = false;
  }
}

void setupMotor(Motor& mm, const uint8_t pins[4], uint8_t potPin){
  for(int k=0;k<4;k++){ mm.p[k]=pins[k]; pinMode(mm.p[k], OUTPUT); }
  mm.idx=0; mm.cur=0; mm.tgt=0; mm.lastUs=0;
  mm.stepIntervalUs = BASE_STEP_US;     // start slow
  mm.filt=analogRead(potPin); mm.prev=mm.filt; mm.cmd=mm.filt;
  mm.lastChangeMs=millis(); mm.movingPot=false;
  setCoils(mm);
}

I.L.V, [10/9/2025 12:24 AM]
void setup(){
  setupMotor(m[0], M_PINS[0], POT_PINS[0]);
  setupMotor(m[1], M_PINS[1], POT_PINS[1]);
  setupMotor(m[2], M_PINS[2], POT_PINS[2]);
}

void loop(){
  updatePotAndCommit(m[0],0);
  updatePotAndCommit(m[1],1);
  updatePotAndCommit(m[2],2);

  unsigned long now = micros();
  serviceMotor(m[0], now);
  serviceMotor(m[1], now);
  serviceMotor(m[2], now);
}
