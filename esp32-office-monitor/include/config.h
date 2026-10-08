#pragma once

// ── WiFi ──────────────────────────────────────────────────────
#define WIFI_SSID        "Innovation Lab"  
#define WIFI_PASSWORD    "ilab@diu123"    

// ── MQTT ──────────────────────────────────────────────────────
#define MQTT_SERVER      "a797be32ae124864a802354324c114e3.s1.eu.hivemq.cloud" 
#define MQTT_PORT        8883                                             
#define MQTT_USER        "mqttBroker"                                   
#define MQTT_PASSWORD    "mqtt25150"
#define MQTT_CLIENT_ID   "a797be32ae124864a802354324c114e3"  // unique client ID for this device             

// ── MQTT Topics ───────────────────────────────────────────────
#define MQTT_ROOT           "office/monitor"
#define TOPIC_TEMP          MQTT_ROOT "/temperature"
#define TOPIC_HUMIDITY      MQTT_ROOT "/humidity"
#define TOPIC_HEAT_IDX      MQTT_ROOT "/heat_index"
#define TOPIC_GAS_PPM       MQTT_ROOT "/gas_ppm"
#define TOPIC_GAS_LEVEL     MQTT_ROOT "/gas_level"      // SAFE / WARNING / DANGER
#define TOPIC_SMOKE         MQTT_ROOT "/smoke"           // CLEAR / SMOKE_DETECTED
#define TOPIC_FIRE          MQTT_ROOT "/fire"            // CLEAR / FIRE_DETECTED
#define TOPIC_LIGHT_LUX     MQTT_ROOT "/light_lux"      // approximate lux from LDR
#define TOPIC_LIGHT_SCENE   MQTT_ROOT "/light_scene"    // DARK / DIM / BRIGHT
#define TOPIC_RELAY         MQTT_ROOT "/relay_state"    // ON / OFF
#define TOPIC_ALERT         MQTT_ROOT "/alert"          // alert description string
#define TOPIC_STATUS        MQTT_ROOT "/status"         // online / offline (retained)
#define TOPIC_JSON          MQTT_ROOT "/all"            // full JSON every 5 s


// ── DHT22 ─────────────────────────────────────────────────────
#define DHT_PIN          4     
#define DHT_TYPE         DHT22

// ── MQ-35 Gas Sensor (analog out) ─────────────────────────────
#define MQ35_PIN         34      // ADC1 — GPIO32-39 only for ADC
#define MQ35_WARMUP_MS   30000   // 30 s heater warm-up
// ADC thresholds (calibrate in clean air):
#define GAS_SAFE_MAX     1500     // ADC < 1500 = SAFE
#define GAS_WARN_MAX     2500     // ADC < 2500 = WARNING
                                 // else       = DANGER

// ── Smoke Sensor (digital out, e.g. MQ-2 or MQ-135 DOUT) ─────
#define SMOKE_PIN        35      // LOW = smoke detected (active-low)
#define SMOKE_ACTIVE_LOW true    // set false if module is active-high

// ── Fire Sensor (IR flame sensor, digital out)
#define FIRE_PIN         32      // LOW = fire detected  (active-low)
#define FIRE_ACTIVE_LOW  false    // set false if module is active-high
//#define FIRE_ACTIVE_LOW  true    

// ── LDR (Photoresistor, analog) ───────────────────────────────
// Wiring: LDR one leg → 3.3V; other leg → GPIO33 AND → 10kΩ → GND
#define LDR_PIN          33      // ADC1 analog input
// Scene thresholds (higher ADC = brighter, for voltage-divider with GND)
#define LDR_DARK_MAX     1200
#define LDR_DIM_MAX      2800
                                 // else BRIGHT

// ── Active Buzzer ─────────────────────────────────────────────
#define BUZZER_PIN       26

// ── Relay Module (active-LOW, typical) ───────────────────────
// Controls office appliance (fan, ventilation, exhaust, etc.)
#define RELAY_PIN        27
#define RELAY_ACTIVE_LOW true    // most relay boards: LOW = relay ON

// ── Timing ────────────────────────────────────────────────────
#define SENSOR_READ_MS   3000    // read all sensors every 3 s
#define MQTT_PUBLISH_MS  5000    // publish MQTT every 5 s
#define LCD_CYCLE_MS     4000    // rotate LCD pages every 4 s
#define MQTT_RECONNECT_MS 5000   // MQTT retry interval
