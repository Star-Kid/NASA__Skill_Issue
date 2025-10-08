/* UNO #2 — Smooth servos: pot filtering + slew-limit
 * Pins:
 *  Servo A (A0) -> D8
 *  Servo B (A1) -> D9
 *  Servo C (button) -> D10
 *  Button -> A2 to GND (INPUT_PULLUP)
 */

#include <Servo.h>

const uint8_t SERVO_A_PIN = 8;
const uint8_t SERVO_B_PIN = 9;
const uint8_t SERVO_C_PIN = 10;

const uint8_t POT_A = A0;
const uint8_t POT_B = A1;
const uint8_t BUTTON_PIN = A2;

// Button servo endpoints
const int SERVO_C_OPEN  = 10;
const int SERVO_C_CLOSE = 170;

// smoothing / slew
const int LPF_N = 4;           // IIR weight: new = (old*(N-1)+raw)/N
const int MAX_STEP_DEG = 3;    // max degrees change per loop for smoothness

Servo SA, SB, SC;
int filtA, filtB;              // filtered ADC
int curA=90, curB=90;          // current servo angles
int curC=SERVO_C_OPEN;

void smoothWrite(Servo &s, int &cur, int target){
  if (target > cur + MAX_STEP_DEG) cur += MAX_STEP_DEG;
  else if (target < cur - MAX_STEP_DEG) cur -= MAX_STEP_DEG;
  else cur = target;
  s.write(cur);
}

void setup(){
  SA.attach(SERVO_A_PIN);
  SB.attach(SERVO_B_PIN);
  SC.attach(SERVO_C_PIN);

  pinMode(BUTTON_PIN, INPUT_PULLUP);

  filtA = analogRead(POT_A);
  filtB = analogRead(POT_B);

  SA.write(curA);
  SB.write(curB);
  SC.write(curC);
}

void loop(){
  // pots with small IIR smoothing
  int ra = analogRead(POT_A);
  int rb = analogRead(POT_B);
  filtA = (filtA*(LPF_N-1) + ra) / LPF_N;
  filtB = (filtB*(LPF_N-1) + rb) / LPF_N;

  int tgtA = map(filtA, 0, 1023, 0, 180);
  int tgtB = map(filtB, 0, 1023, 0, 180);

  smoothWrite(SA, curA, tgtA);
  smoothWrite(SB, curB, tgtB);

  // button servo (pressed = close)
  bool pressed = (digitalRead(BUTTON_PIN) == LOW);
  int tgtC = pressed ? SERVO_C_CLOSE : SERVO_C_OPEN;
  smoothWrite(SC, curC, tgtC);

  delay(10);  // pace the loop; affects slew speed
}
