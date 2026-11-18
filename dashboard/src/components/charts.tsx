'use client';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { COLORS } from './ui';

const axis = { fontSize: 12, fill: '#5f6d80' };

export interface Point {
  t: string;
  calls: number;
  commits: number;
  reads: number;
  logical: number;
  redoKb: number;
}

export function LiveLines({
  data,
  lines,
}: {
  data: Point[];
  lines: { key: keyof Point; label: string; color: string }[];
}) {
  if (data.length < 2) return <div className="empty">Collecting live samples... (needs a few seconds)</div>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: -12 }}>
        <CartesianGrid stroke="#eef1f6" vertical={false} />
        <XAxis dataKey="t" tick={axis} minTickGap={36} />
        <YAxis tick={axis} allowDecimals />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {lines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} name={l.label} stroke={l.color}
                strokeWidth={2} dot={false} isAnimationActive={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div>
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82}
               paddingAngle={2} isAnimationActive={false}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="legend">
        {data.map((d, i) => (
          <div key={d.name}>
            <span className="name"><i className="swatch" style={{ background: COLORS[i % COLORS.length] }} />{d.name}</span>
            <span>{d.value.toLocaleString()} ({total ? Math.round((d.value / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StackedBars({
  data,
  height,
}: {
  data: { name: string; used: number; free: number }[];
  height: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid stroke="#eef1f6" horizontal={false} />
        <XAxis type="number" tick={axis} unit=" MB" />
        <YAxis type="category" dataKey="name" tick={axis} width={96} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="used" name="Used" stackId="a" fill="#c74634" isAnimationActive={false} />
        <Bar dataKey="free" name="Free" stackId="a" fill="#dfe4ec" isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SimpleBars({ data, color }: { data: { name: string; value: number }[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(150, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid stroke="#eef1f6" horizontal={false} />
        <XAxis type="number" tick={axis} />
        <YAxis type="category" dataKey="name" tick={axis} width={120} />
        <Tooltip />
        <Bar dataKey="value" name="In stock" fill={color} radius={[0, 6, 6, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
