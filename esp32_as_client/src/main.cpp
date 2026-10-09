#include <Arduino.h>

#include <BluetoothSerial.h>
#include <WiFi.h>
#include <WiFiMulti.h>

#include <HTTPClient.h>

#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error Bluetooth is not enabled! Please run `make menuconfig` to and enable it
#endif

#if !defined(CONFIG_BT_SPP_ENABLED)
#error Serial Bluetooth not available or not enabled. It is only available for the ESP32 chip.
#endif

BluetoothSerial SerialBT;

#define BT_DISCOVER_TIME 10000
#define USE_SERIAL Serial

WiFiMulti wifiMulti;

HTTPClient http;

static bool btScanAsync = true;
static bool btScanSync = true;

void btAdvertisedDeviceFound(BTAdvertisedDevice *pDevice)
{
  Serial.printf("Found a device asynchronously: %s\n", pDevice->toString().c_str());
}

void setup()
{
  Serial.begin(115200);
  SerialBT.begin("ESP32test"); // Bluetooth device name
  Serial.println("The device started, now you can pair it with bluetooth!");

  if (btScanAsync)
  {
    Serial.print("Starting discoverAsync...");
    if (SerialBT.discoverAsync(btAdvertisedDeviceFound))
    {
      Serial.println("Findings will be reported in \"btAdvertisedDeviceFound\"");
      delay(10000);
      Serial.print("Stopping discoverAsync... ");
      SerialBT.discoverAsyncStop();
      Serial.println("stopped");
    }
    else
    {
      Serial.println("Error on discoverAsync f.e. not workin after a \"connect\"");
    }
  }

  if (btScanSync)
  {
    Serial.println("Starting discover...");
    BTScanResults *pResults = SerialBT.discover(BT_DISCOVER_TIME);
    if (pResults)
      pResults->dump(&Serial);
    else
      Serial.println("Error on BT Scan, no result!");
  }
  for (uint8_t t = 4; t > 0; t--)
  {
    USE_SERIAL.printf("[SETUP] WAIT %d...\n", t);
    USE_SERIAL.flush();
    delay(1000);
  }

  wifiMulti.addAP("Bro's House", "#8888@8888#");

  // allow reuse (if server supports it)
  http.setReuse(true);
}

void loop()
{
  // wait for WiFi connection
  if ((wifiMulti.run() == WL_CONNECTED))
  {

    http.begin("http://localhost:5173/");
    // http.begin("192.168.1.12", 80, "/test.html");

    int httpCode = http.GET();
    if (httpCode > 0)
    {
      USE_SERIAL.printf("[HTTP] GET... code: %d\n", httpCode);

      // file found at server
      if (httpCode == HTTP_CODE_OK)
      {
        http.writeToStream(&USE_SERIAL);
      }
    }
    else
    {
      USE_SERIAL.printf("[HTTP] GET... failed, error: %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();
  }

  delay(1000);
}