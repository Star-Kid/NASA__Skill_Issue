#include <Wire.h>
#include <MPU6050_light.h>

// Инициализация MPU6050 с шиной Wire
MPU6050 mpu(Wire);

void setup() {
  Serial.begin(115200);
  Wire.begin(22, 23); // SDA=22, SCL=23

  byte status = mpu.begin();
  if(status != 0){
    Serial.println("Ошибка подключения MPU6050");
    while(1);
  }

  Serial.println("MPU6050 готов");
  mpu.calcOffsets(); // Калибровка (держи плату ровно)
}

void loop() {
  mpu.update(); // Обновление данных с датчика

  // Получаем углы в градусах
  float roll  = mpu.getRoll();
  float pitch = mpu.getPitch();
  float yaw   = mpu.getYaw(); // yaw интегрируется гироскопом

  // Вывод в серийный монитор
  Serial.print("Roll: "); Serial.print(roll);
  Serial.print("  Pitch: "); Serial.print(pitch);
  Serial.print("  Yaw: "); Serial.println(yaw);

  delay(100); // Обновление каждые 100 мс
}
