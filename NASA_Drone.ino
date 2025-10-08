#include <Wire.h>
  #include <MPU6050_light.h>
  #include <PID_v1.h>
  
  MPU6050 mpu(Wire);
  
  const int motorFL = 26;  // Front Left
  const int motorFR = 27;  // Front Right
  const int motorBL = 14;  // Back Left
  const int motorBR = 12;  // Back Right
  
  double inputRoll, outputRoll, setpointRoll = 0;
  double KpR = 1.5, KiR = 0.01, KdR = 0.5;
  PID pidRoll(&inputRoll, &outputRoll, &setpointRoll, KpR, KiR, KdR, DIRECT);
  
  double inputPitch, outputPitch, setpointPitch = 0;
  double KpP = 1.5, KiP = 0.01, KdP = 0.5;
  PID pidPitch(&inputPitch, &outputPitch, &setpointPitch, KpP, KiP, KdP, DIRECT);
  
  int basePower = 150; // Настроить под батарею и моторы
  int maxOutput = 100; // Ограничение PID
  
  void setup() {
    Wire.begin(22, 23);
    Serial.begin(115200);
  
    mpu.begin();
    delay(1000);      
    mpu.calcOffsets();
  
    ledcSetup(0, 1000, 8); ledcAttachPin(motorFL, 0);
    ledcSetup(1, 1000, 8); ledcAttachPin(motorFR, 1);
    ledcSetup(2, 1000, 8); ledcAttachPin(motorBL, 2);
    ledcSetup(3, 1000, 8); ledcAttachPin(motorBR, 3);
  
  
    pidRoll.SetMode(AUTOMATIC);
    pidPitch.SetMode(AUTOMATIC);
  }
  
  void loop() {
    mpu.update();
  
    // get angles
    inputRoll  = mpu.getAngleX(); // наклон влево/вправо
    inputPitch = mpu.getAngleY(); // наклон вперёд/назад
  
    // PID calc
    pidRoll.Compute();
    pidPitch.Compute();
  
    // PWD corners
    outputRoll  = constrain(outputRoll, -maxOutput, maxOutput);
    outputPitch = constrain(outputPitch, -maxOutput, maxOutput);
  
    int motorFL_power = constrain(basePower + outputRoll + outputPitch, 0, 255);
    int motorFR_power = constrain(basePower - outputRoll + outputPitch, 0, 255);
    int motorBL_power = constrain(basePower + outputRoll - outputPitch, 0, 255);
    int motorBR_power = constrain(basePower - outputRoll - outputPitch, 0, 255);
  
    // send PWM to motors
    ledcWrite(0, motorFL_power);
    ledcWrite(1, motorFR_power);
    ledcWrite(2, motorBL_power);
    ledcWrite(3, motorBR_power);
  
  
    Serial.print("Roll: "); Serial.print(inputRoll);
    Serial.print("\tPitch: "); Serial.print(inputPitch);
    Serial.print("\tPID Roll: "); Serial.print(outputRoll);
    Serial.print("\tPID Pitch: "); Serial.println(outputPitch);
  
    delay(10); // cycle ~100 Гц
  }
  
  // Fly func
  void flyForSeconds(double targetRoll, double targetPitch, unsigned long durationMs) {
    setpointRoll  = targetRoll;
    setpointPitch = targetPitch;
    
    unsigned long startTime = millis();
    
    while (millis() - startTime < durationMs) {
      mpu.update();
  
      // Reading angles
      inputRoll  = mpu.getAngleX();
      inputPitch = mpu.getAngleY();
  
      // PID calc
      pidRoll.Compute();
      pidPitch.Compute();
  
      outputRoll  = constrain(outputRoll, -maxOutput, maxOutput);
      outputPitch = constrain(outputPitch, -maxOutput, maxOutput);
  
      // calc moters power
      int motorFL_power = constrain(basePower + outputRoll + outputPitch, 0, 255);
      int motorFR_power = constrain(basePower - outputRoll + outputPitch, 0, 255);
      int motorBL_power = constrain(basePower + outputRoll - outputPitch, 0, 255);
      int motorBR_power = constrain(basePower - outputRoll - outputPitch, 0, 255);
  
      // Send to DWD
      ledcWrite(0, motorFL_power);
      ledcWrite(1, motorFR_power);
      ledcWrite(2, motorBL_power);
      ledcWrite(3, motorBR_power);
  
      delay(10); // cyc;e ~100 Гц
    }
  
    // return drone to zero after
    setpointRoll  = 0;
    setpointPitch = 0;
  }
  
  flyForSeconds(10, 0, 5000); // roll 10deg pitch 0deg time - 5 sec
