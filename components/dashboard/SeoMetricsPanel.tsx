import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Plus, Save, Loader2, TrendingUp, FileText } from 'lucide-react'

export function SeoMetricsPanel({ projectId }: { projectId: string }) {
    const { seoMetrics, fetchSeoMetrics, upsertSeoMetric, profile } = useAppStore()
    const [loading, setLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [formData, setFormData] = useState({ month: '', articles_count: 0, gsc_traffic: 0 })
    const [submitting, setSubmitting] = useState(false)

    const isManager = profile?.role === 'manager'

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            await fetchSeoMetrics(projectId)
            setLoading(false)
        }
        loadData()
    }, [projectId, fetchSeoMetrics])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.month) return

        setSubmitting(true)
        await upsertSeoMetric({
            project_id: projectId,
            month: formData.month,
            articles_count: Number(formData.articles_count),
            gsc_traffic: Number(formData.gsc_traffic)
        })
        setSubmitting(false)
        setIsFormOpen(false)
        setFormData({ month: '', articles_count: 0, gsc_traffic: 0 })
    }

    // Generate last 6 months for input options
    const monthOptions = Array.from({ length: 12 }, (_, i) => {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        return `${yyyy}-${mm}`
    })

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Hiệu suất SEO (Traffic & Bài viết)
                </h2>
                {isManager && (
                    <button
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        className="btn-secondary h-9 px-4 text-xs font-bold flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Cập nhật chỉ số
                    </button>
                )}
            </div>

            {isFormOpen && (
                <form onSubmit={handleSubmit} className="glass-card p-5 rounded-xl border border-border shadow-sm flex flex-wrap gap-4 items-end animate-in fade-in zoom-in-95">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Tháng</label>
                        <select
                            value={formData.month}
                            onChange={e => setFormData({ ...formData, month: e.target.value })}
                            className="h-10 px-3 bg-secondary border border-border rounded-lg text-sm w-40"
                            required
                        >
                            <option value="">-- Chọn tháng --</option>
                            {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Số bài viết
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={formData.articles_count}
                            onChange={e => setFormData({ ...formData, articles_count: parseInt(e.target.value) || 0 })}
                            className="h-10 px-3 bg-secondary border border-border rounded-lg text-sm w-32"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> GSC Traffic
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={formData.gsc_traffic}
                            onChange={e => setFormData({ ...formData, gsc_traffic: parseInt(e.target.value) || 0 })}
                            className="h-10 px-3 bg-secondary border border-border rounded-lg text-sm w-40"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary h-10 px-6 font-bold"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Lưu
                    </button>
                </form>
            )}

            {seoMetrics.length === 0 ? (
                <div className="text-center p-10 text-muted-foreground glass-card rounded-2xl border-dashed">
                    Chưa có dữ liệu theo dõi SEO. Cập nhật chỉ số tháng để bắt đầu biểu đồ.
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass-card p-5 rounded-2xl shadow-sm">
                        <h3 className="font-bold text-sm mb-4 text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-500" /> Tăng trưởng Traffic GSC
                        </h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={seoMetrics} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#88888833" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => val.toLocaleString()} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => [value.toLocaleString(), 'Traffic']}
                                    />
                                    <Line type="monotone" dataKey="gsc_traffic" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-card p-5 rounded-2xl shadow-sm">
                        <h3 className="font-bold text-sm mb-4 text-muted-foreground flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" /> Sản lượng Bài viết (Articles)
                        </h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={seoMetrics} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#88888833" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: '#88888810' }}
                                        formatter={(value: number) => [value, 'Bài viết']}
                                    />
                                    <Bar dataKey="articles_count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
