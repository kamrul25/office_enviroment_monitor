# ESP32 IoT Office Environment Monitor

**Reference document:** IoT-Based Office Environment Monitoring System

## What changed from the previous project

| Previous project | This project |
|-----------------|--------------|
| SSD1306 OLED | 16×2 LCD (I2C) |
| KY-039 Pulse/RIP sensor | ~~Removed~~ |
| BH1750 digital light sensor | LDR / Photoresistor (analog) |
| MQ-135 Air quality | MQ-35 Gas sensor |
| No fire detection | **Fire sensor (IR flame)** added |
| No smoke detection | **Smoke sensor (digital)** added |
| No relay | **Relay module** added (exhaust fan) |
| General environment station | Office safety + environment monitor |

---

## Sensors & Unique Ideas

| Sensor | Measures | Unique feature |
|--------|----------|---------------|
| **DHT22** | Temp + Humidity | **Comfort Zone Advisor** — rates as IDEAL/ACCEPTABLE/UNCOMFORTABLE with plain-English tip (e.g. "Lower AC setpoint by 2°C"), based on ASHRAE 55 office standards |
| **MQ-35** | Gas (CO₂/VOC/flammable) | **Gas Trend Watchdog** — 10-sample rolling average detects RISING/STABLE/FALLING trend; auto-activates relay when trend is RISING at WARNING level |
| **Smoke sensor** | Particulate smoke | **Two-stage alert** — instant buzz on first detection; if smoke persists > 10 s, relay activates AND CRITICAL MQTT alert fires |
| **Fire sensor** | IR flame | **Priority alert with timestamp** — overrides all relay logic, triggers urgent buzzer pattern, publishes MQTT alert with uptime timestamp for incident log |
| **LDR** | Ambient light | **Smart Light Energy Advisor** — classifies DARK/DIM/BRIGHT and advises on lighting/blinds for energy efficiency |
| **Relay** | Controls exhaust fan | Auto-ON on gas danger, persistent smoke, or fire; auto-OFF after 30 s all-clear |

---

## Project structure

```
esp32-office-monitor/
├── platformio.ini       ← Board + libraries (auto-installed)
├── include/
│   └── config.h         ← ★ Only file to edit ★  (WiFi, pins, thresholds)
└── src/
    └── main.cpp         ← All application code — no editing needed
```

---

## Setup (2 steps)

### Step 1 — Set WiFi credentials
Open `include/config.h` and change:
```cpp
#define WIFI_SSID     "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
```

### Step 2 — Flash
```bash
pio run --target upload
pio device monitor --baud 115200
```

---

## Wiring

### DHT22
| Pin | ESP32 | Note |
|-----|-------|------|
| VCC | 3.3V | |
| DATA | GPIO4 | 10kΩ pull-up to 3.3V required |
| GND | GND | |

### MQ-35 Gas Sensor
| Pin | ESP32 | Note |
|-----|-------|------|
| VCC | **5V** | Needs 5V for heater |
| AOUT | GPIO34 | Analog output |
| GND | GND | |
> 30 s warm-up after power-on; readings show WARMING_UP until ready.

### Smoke Sensor
| Pin | ESP32 | Note |
|-----|-------|------|
| VCC | 5V | |
| DOUT | GPIO35 | Digital out (LOW = smoke) |
| GND | GND | |

### Fire Sensor (IR Flame)
| Pin | ESP32 | Note |
|-----|-------|------|
| VCC | 3.3V | |
| DOUT | GPIO32 | Digital out (LOW = fire) |
| GND | GND | |

### LDR (Photoresistor)
```
3.3V ──── LDR ──┬── GPIO33
                │
               10kΩ
                │
               GND
```

### 16×2 LCD (I2C backpack)
| Pin | ESP32 |
|-----|-------|
| VCC | 5V |
| GND | GND |
| SDA | GPIO21 |
| SCL | GPIO22 |
> Default I2C address: 0x27. Change to 0x3F in config.h if nothing shows.

### Active Buzzer
| Pin | ESP32 |
|-----|-------|
| + | GPIO26 |
| − | GND |

### Relay Module
| Pin | ESP32 | Note |
|-----|-------|------|
| VCC | 5V | |
| IN | GPIO27 | Signal input |
| GND | GND | |
> Most relay boards are active-LOW (LOW = relay energised). Set `RELAY_ACTIVE_LOW false` in config.h if yours is active-high.

---

## MQTT Topics

Subscribe with: `office/monitor/001/#` on `broker.hivemq.com:1883`

| Topic | Value |
|-------|-------|
| `.../temperature` | float °C |
| `.../humidity` | float % |
| `.../heat_index` | float °C |
| `.../gas_ppm` | int (raw ADC) |
| `.../gas_level` | SAFE / WARNING / DANGER |
| `.../smoke` | CLEAR / SMOKE_DETECTED |
| `.../fire` | CLEAR / FIRE_DETECTED |
| `.../light_lux` | int (approx) |
| `.../light_scene` | DARK / DIM / BRIGHT |
| `.../relay_state` | ON / OFF |
| `.../alert` | alert string |
| `.../status` | online / offline (retained) |
| `.../all` | full JSON every 5 s |

### JSON example
```json
{
  "device": "office-monitor-001",
  "uptime_s": 300,
  "temperature": { "celsius": 24.1, "humidity": 55.3, "heat_index": 24.8, "comfort": "IDEAL", "tip": "Office conditions optimal" },
  "gas": { "raw_adc": 220, "level": "SAFE", "trend": "STABLE" },
  "smoke": false,
  "fire": false,
  "light": { "lux": 420, "scene": "BRIGHT", "advisory": "Good natural or artificial light" },
  "relay_on": false
}
```

## LCD pages (rotates every 4 s)

| Page | Row 1 | Row 2 |
|------|-------|-------|
| 1 | `T:24.1C H:55%` | `IDEAL` |
| 2 | `Gas: SAFE` | `Trend: STABLE` |
| 3 | `Smoke: CLEAR` | `Fire : CLEAR` |
| 4 | `Light: BRIGHT` | `Relay: OFF` |

> Fire or persistent smoke override all pages with a full-screen alert.

## Buzzer patterns

| Pattern | Trigger |
|---------|---------|
| `▄▄ ▄▄ ▄▄` | Gas WARNING / DANGER |
| `▄ ▄ ▄ ▄` (rapid) | Smoke detected |
| `▄▄▄▄▄▄▄▄ ████` (urgent) | Fire detected |
| `▄▄ ▄▄` | Startup / MQTT connected |

## Libraries used (auto-installed)
- `DHT sensor library` + `Adafruit Unified Sensor`
- `LiquidCrystal_I2C` (marcoschwartz)
- `PubSubClient` (MQTT)
- `ArduinoJson`
