import { createChart } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

export default function CandleChart({ data }) {
  const chartContainerRef = useRef();

  useEffect(() => {
    const chart = createChart(chartContainerRef.current, {
        width: 400,
        height: 100,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#111827',
        },
        grid: {
          vertLines: { color: 'transparent' },
          horzLines: { color: 'transparent' },
        },
        priceScale: {
          borderColor: '#e5e7eb',
        },
        timeScale: {
          borderColor: '#e5e7eb',
          timeVisible: true,
          secondsVisible: false,
        },
      });
      
      chart.applyOptions({
        watermark: {
          visible: false,
        },
      });
      

    const candleSeries = chart.addCandlestickSeries();

    const formattedData = [...data]
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map((d, i, arr) => {
            const next = arr[i + 1] || d;
            return {
            time: Math.floor(new Date(d.timestamp).getTime() / 1000),
            open: d.price,
            close: next.price,
            high: Math.max(d.price, next.price),
            low: Math.min(d.price, next.price),
            };
        });

        
      

    candleSeries.setData(formattedData);

    return () => chart.remove();
  }, [data]);

  return <div ref={chartContainerRef} />;
}
