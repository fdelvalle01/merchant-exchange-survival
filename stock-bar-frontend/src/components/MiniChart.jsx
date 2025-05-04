import { LineChart, Line, ResponsiveContainer } from "recharts";

export default function MiniChart({ data }) {

    if (!data || data.length < 2) return null;

    const isUp = data[data.length - 1].price > data[0].price;
    const lineColor = isUp ? '#22c55e' : '#ef4444';
    

    return (
        <div className="w-full h-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line
                type="monotone"
                dataKey="price"
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
      
}
