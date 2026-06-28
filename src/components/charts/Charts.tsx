// Recharts wrappers for citizen + authority dashboards.
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts'

const AXIS = { fontSize: 11, fill: '#6b7280' }

export function PieCard({
  data,
  height = 220,
}: {
  data: { name: string; value: number; color: string }[]
  height?: number
}) {
  if (data.length === 0) return <Empty height={height} />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="45%"
          outerRadius="80%"
          paddingAngle={2}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function BarCard({
  data,
  height = 240,
  color = '#F4811F',
  layout = 'horizontal',
  dataKey = 'value',
  nameKey = 'name',
}: {
  data: Record<string, any>[]
  height?: number
  color?: string
  layout?: 'horizontal' | 'vertical'
  dataKey?: string
  nameKey?: string
}) {
  if (data.length === 0) return <Empty height={height} />
  const vertical = layout === 'vertical'
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout} margin={{ left: vertical ? 24 : 0, right: 12, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        {vertical ? (
          <>
            <XAxis type="number" tick={AXIS} />
            <YAxis type="category" dataKey={nameKey} tick={AXIS} width={110} />
          </>
        ) : (
          <>
            <XAxis dataKey={nameKey} tick={AXIS} interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis tick={AXIS} />
          </>
        )}
        <Tooltip />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function LineCard({
  data,
  height = 240,
  lines,
}: {
  data: Record<string, any>[]
  height?: number
  lines: { key: string; color: string; name: string }[]
}) {
  if (data.length === 0) return <Empty height={height} />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="name" tick={AXIS} />
        <YAxis tick={AXIS} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {lines.map((l) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            stroke={l.color}
            name={l.name}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export function StackedBarCard({
  data,
  height = 240,
  bars,
}: {
  data: Record<string, any>[]
  height?: number
  bars: { key: string; color: string; name: string }[]
}) {
  if (data.length === 0) return <Empty height={height} />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="name" tick={AXIS} />
        <YAxis tick={AXIS} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {bars.map((b) => (
          <Bar key={b.key} dataKey={b.key} stackId="a" fill={b.color} name={b.name} radius={[3, 3, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

function Empty({ height }: { height: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-black/[0.02] text-sm text-ink/40"
      style={{ height }}
    >
      No data yet
    </div>
  )
}
