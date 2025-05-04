import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
  } from "recharts";
  
  export default function PriceChart({ data }) {
    return (
        <div className="mt-4 rounded bg-gray-900 text-white p-2 shadow-inner">

        <h3 className="text-sm font-semibold mb-2 text-white">📈 Historial de Precios</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data}>
            <XAxis
              dataKey="timestamp"
              tickFormatter={(t) => t.slice(11, 16)}
              stroke="#ccc"
              fontSize={10}
            />
            <YAxis stroke="#ccc" fontSize={10} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e1e1e", border: "none", color: "#fff" }}
              labelStyle={{ color: "#ccc" }}
            />
          <defs>
                <linearGradient id="priceLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                </linearGradient>
                </defs>
                <Line
                type="monotone"
                dataKey="price"
                stroke="url(#priceLine)"
                strokeWidth={2}
                dot={false}
                />

          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
  