import React, { useEffect, useState } from 'react';
import mqtt from 'mqtt';
import { Thermometer, Droplets, Flame, AlertTriangle, Power, Activity, Sun, ShieldAlert, Clock, Gauge } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function App() {
  const [status, setStatus] = useState('Connecting...');
  const [sensorData, setSensorData] = useState({
    device: 'ESP32_OFFICE',
    uptime_s: 0,
    temperature: { celsius: 0, humidity: 0, heat_index: 0, comfort: "WAITING", tip: "", valid: true },
    gas: { raw_adc: 0, level: "WAITING", trend: "STABLE" },
    ldr: { raw: 0, status: "WAITING", lux: 0, advisory: "" },
    smoke: false,
    fire: false,
    relay_on: false
  });

  const [history, setHistory] = useState([]);

  useEffect(() => {
    const brokerUrl = 'wss://a797be32ae124864a802354324c114e3.s1.eu.hivemq.cloud:8884/mqtt';
    const client = mqtt.connect(brokerUrl, {
      username: 'mqttBroker',
      password: 'mqtt25150',
      clientId: `web_client_${Math.random().toString(16).slice(3)}`
    });

    client.on('connect', () => {
      setStatus('Live');
      client.subscribe('office/monitor/all');
    });

    client.on('message', (topic, message) => {
      if (topic === 'office/monitor/all') {
        try {
          const payload = JSON.parse(message.toString());
          setSensorData(payload);

          setHistory(prev => {
            const newPoint = {
              time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              temp: payload.temperature?.celsius ?? 0,
              humidity: payload.temperature?.humidity ?? 0,
              gas: payload.gas?.raw_adc ?? 0,
              lux: payload.ldr?.lux ?? 0
            };
            return [...prev, newPoint].slice(-20);
          });
        } catch (e) {
          console.error("JSON Parse Error", e);
        }
      }
    });

    client.on('error', (err) => {
      setStatus('Connection Error');
      console.error(err);
    });

    return () => client.end();
  }, []);

  const formatUptime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const isDanger = sensorData.fire || sensorData.smoke || sensorData.gas?.level === "DANGER";
  const headerBg = isDanger ? "bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.6)]" : "bg-blue-600 shadow-lg";

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-6 lg:p-8 font-sans selection:bg-blue-500 selection:text-white">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className={`${headerBg} rounded-xl p-6 mb-8 flex flex-col sm:flex-row justify-between items-center transition-all duration-500 border border-white/10`}>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Office Environment Monitor</h1>
            <div className="text-white/80 mt-2 flex flex-wrap items-center gap-4 text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <Activity size={18} className={status === 'Live' ? "animate-pulse text-green-300" : "text-yellow-300"} />
                Status: {status}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={16} />
                Uptime: {formatUptime(sensorData.uptime_s || 0)}
              </span>
            </div>
          </div>
          {isDanger && (
            <div className="mt-4 sm:mt-0 animate-bounce bg-white text-red-700 px-6 py-3 rounded-lg font-black text-xl flex items-center gap-3 shadow-xl">
              <AlertTriangle size={28} /> EVACUATE NOW
            </div>
          )}
        </div>

        {/* Top Metric Cards: 6-Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">

          {/* 1. Temperature */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-gray-400 font-medium">Temperature</h2>
              <Thermometer className="text-blue-400" size={20} />
            </div>
            <div className="text-3xl font-bold">{sensorData.temperature?.celsius ?? 0}°C</div>
            <div className="mt-2 text-xs text-gray-400 uppercase tracking-wider flex justify-between">
              <span>State: <strong className="text-gray-200">{sensorData.temperature?.comfort || "N/A"}</strong></span>
              <span>HI: {sensorData.temperature?.heat_index ?? 0}°C</span>
            </div>
          </div>

          {/* 2. Humidity */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-gray-400 font-medium">Humidity</h2>
              <Droplets className="text-blue-400" size={20} />
            </div>
            <div className="text-3xl font-bold">{sensorData.temperature?.humidity ?? 0}%</div>
            <div className="mt-2 text-xs text-gray-400 uppercase tracking-wider">
              {sensorData.temperature?.tip || "Target Range: 40% - 60%"}
            </div>
          </div>

          {/* 3. Ambient Light (LDR & Lux) */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-gray-400 font-medium">Ambient Light</h2>
              <Sun className={sensorData.ldr?.status === 'DARK' ? "text-gray-600" : "text-yellow-400"} size={20} />
            </div>
            <div className="text-3xl font-bold">{sensorData.ldr?.lux ?? 0} <span className="text-sm text-gray-400 font-normal">Lux</span></div>
            <div className="mt-2 text-xs text-gray-400 uppercase tracking-wider flex justify-between">
              <span>Scene: <strong className="text-gray-200">{sensorData.ldr?.status || "N/A"}</strong></span>
              <span>ADC: {sensorData.ldr?.raw ?? 0}</span>
            </div>
          </div>

          {/* 4. Air Quality Trend */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-gray-400 font-medium">Gas Concentration</h2>
              <Gauge className="text-emerald-400" size={20} />
            </div>
            <div className="text-3xl font-bold">{sensorData.gas?.raw_adc ?? 0} <span className="text-sm text-gray-400 font-normal">ADC</span></div>
            <div className="mt-2 text-xs text-gray-400 uppercase tracking-wider flex justify-between">
              <span>Status: <strong className="text-gray-200">{sensorData.gas?.level || "N/A"}</strong></span>
              <span>Trend: <strong className="text-gray-200">{sensorData.gas?.trend || "STABLE"}</strong></span>
            </div>
          </div>

          {/* 5. Smoke Sensor */}
          <div className={`rounded-xl p-5 border transition-all duration-300 ${
            sensorData.smoke 
              ? 'bg-red-950/80 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse' 
              : 'bg-gray-900 border-gray-800 shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-gray-400 font-medium text-sm">Smoke Sensor</h2>
              <ShieldAlert className={sensorData.smoke ? "text-red-400" : "text-gray-600"} size={20} />
            </div>
            <div className={`text-2xl font-black ${sensorData.smoke ? "text-red-400" : "text-gray-300"}`}>
              {sensorData.smoke ? "DETECTED" : "CLEAR"}
            </div>
            <div className="mt-2 text-xs text-gray-500 uppercase tracking-wider">Photoelectric Monitoring</div>
          </div>

          {/* 6. Fire Sensor */}
          <div className={`rounded-xl p-5 border transition-all duration-300 ${
            sensorData.fire 
              ? 'bg-red-950/80 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse' 
              : 'bg-gray-900 border-gray-800 shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-gray-400 font-medium text-sm">Flame Sensor</h2>
              <Flame className={sensorData.fire ? "text-red-400" : "text-gray-600"} size={20} />
            </div>
            <div className={`text-2xl font-black ${sensorData.fire ? "text-red-400" : "text-gray-300"}`}>
              {sensorData.fire ? "DETECTED" : "CLEAR"}
            </div>
            <div className="mt-2 text-xs text-gray-500 uppercase tracking-wider">IR Flame Detection</div>
          </div>

        </div>

        {/* Charts & Status Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Chart */}
          <div className="lg:col-span-2 bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-md">
            <h2 className="text-lg font-semibold mb-6 text-gray-200">Environmental History</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} tickMargin={10} />
                  <YAxis yAxisId="left" stroke="#60A5FA" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="#34D399" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#E5E7EB' }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="temp" name="Temp (°C)" stroke="#60A5FA" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#34D399" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column: Air Quality Chart & Relay Card */}
          <div className="flex flex-col gap-6">

            {/* Gas Level Sparkline Card */}
            <div className={`flex-1 rounded-xl p-6 border transition-all duration-300 ${
              sensorData.gas?.level === 'DANGER' ? 'bg-red-950/50 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 
              sensorData.gas?.level === 'WARNING' ? 'bg-yellow-950/50 border-yellow-500' : 
              'bg-gray-900 border-gray-800 shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-200">Air Quality Live Graph</h2>
                <span className={`text-xs px-2 py-1 rounded font-bold ${
                  sensorData.gas?.level === 'SAFE' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                }`}>
                  {sensorData.gas?.level || "WAITING"}
                </span>
              </div>
              <div className="text-3xl font-bold mb-1">{sensorData.gas?.raw_adc ?? 0} <span className="text-sm font-normal text-gray-400">ADC</span></div>
              <div className="text-xs text-gray-400 mb-4">Trend: {sensorData.gas?.trend || "STABLE"}</div>

              <div className="h-24 mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <Line type="monotone" dataKey="gas" stroke={sensorData.gas?.level === 'SAFE' ? "#34D399" : "#F87171"} strokeWidth={2} dot={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} labelStyle={{ display: 'none' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Safety Relay Control */}
            <div className={`rounded-xl p-6 border transition-all duration-300 ${
              sensorData.relay_on ? 'bg-blue-900/40 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-gray-900 border-gray-800 shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-200">Safety Exhaust Relay</h2>
                <Power className={sensorData.relay_on ? "text-blue-400" : "text-gray-600"} size={24} />
              </div>
              <div className="text-3xl font-bold mt-2">{sensorData.relay_on ? "ACTIVE" : "STANDBY"}</div>
              <div className="mt-1 text-sm text-gray-400">
                {sensorData.relay_on ? "Hazard exhaust ventilation ON" : "Normal operation monitoring"}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}