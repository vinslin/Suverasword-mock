import { useState, useEffect } from 'react'
import { Users, Plus, Pencil, Trash2, AlertTriangle, X } from 'lucide-react'
import { getDirectors, addDirector, updateDirector, deleteDirector } from '../lib/api'

const EMPTY_FORM = {
  name: '',
  din: '',
  pan: '',
  role: '',
  shareholdingPct: '',
  appointmentDate: '',
  email: '',
  phone: '',
}

function DirectorForm({ initial, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM)

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      ...form,
      shareholdingPct: form.shareholdingPct !== '' ? Number(form.shareholdingPct) : null,
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 block">
          <span className="text-[11px] text-gray-500 mb-1 block">Full Name *</span>
          <input
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-indigo-400"
            placeholder="e.g. Ramesh Kumar"
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-gray-500 mb-1 block">Role</span>
          <select
            value={form.role}
            onChange={(e) => set('role', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-indigo-400 bg-white"
          >
            <option value="">Select role</option>
            <option>Managing Director</option>
            <option>Director</option>
            <option>Whole-time Director</option>
            <option>Independent Director</option>
            <option>Nominee Director</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] text-gray-500 mb-1 block">Shareholding %</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.shareholdingPct}
            onChange={(e) => set('shareholdingPct', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-indigo-400"
            placeholder="0.00"
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-gray-500 mb-1 block">DIN</span>
          <input
            value={form.din}
            onChange={(e) => set('din', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-indigo-400"
            placeholder="8-digit DIN"
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-gray-500 mb-1 block">PAN</span>
          <input
            value={form.pan}
            onChange={(e) => set('pan', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-indigo-400"
            placeholder="ABCDE1234F"
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-gray-500 mb-1 block">Appointment Date</span>
          <input
            type="date"
            value={form.appointmentDate}
            onChange={(e) => set('appointmentDate', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-indigo-400"
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-gray-500 mb-1 block">Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-indigo-400"
            placeholder="director@example.com"
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-gray-500 mb-1 block">Phone</span>
          <input
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-indigo-400"
            placeholder="+91 98765 43210"
          />
        </label>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-[13px] font-medium py-2"
        >
          {saving ? 'Saving…' : initial ? 'Update Director' : 'Add Director'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-200 text-gray-600 text-[13px] font-medium px-4 py-2 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function DirectorFormOverlay({ initial, onSubmit, onClose, saving }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-gray-900 text-[14px]">
            {initial ? 'Edit Director' : 'Add Director'}
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <DirectorForm initial={initial} onSubmit={onSubmit} onCancel={onClose} saving={saving} />
      </div>
    </div>
  )
}

export default function DirectorsPanel({ companyId, journeyStep }) {
  const [directors, setDirectors] = useState([])
  const [overlay, setOverlay] = useState(null) // null | 'add' | { director }
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!companyId) return
    getDirectors(companyId)
      .then(setDirectors)
      .catch(() => {})
  }, [companyId])

  async function handleAdd(payload) {
    setSaving(true)
    setError(null)
    try {
      const created = await addDirector(companyId, payload)
      setDirectors((prev) => [...prev, created])
      setOverlay(null)
    } catch (err) {
      setError(err.message || 'Failed to add director')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(id, payload) {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateDirector(companyId, id, payload)
      setDirectors((prev) => prev.map((d) => (d.id === id ? updated : d)))
      setOverlay(null)
    } catch (err) {
      setError(err.message || 'Failed to update director')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this director?')) return
    try {
      await deleteDirector(companyId, id)
      setDirectors((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      setError(err.message || 'Failed to delete director')
    }
  }

  const needsMoreDirectors = directors.length < 2

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-indigo-500" />
            <span className="text-[13px] font-semibold text-gray-900">Directors & Shareholders</span>
            {directors.length > 0 && (
              <span className="text-[11px] bg-indigo-50 text-indigo-600 font-medium px-1.5 py-0.5 rounded-full">
                {directors.length}
              </span>
            )}
          </div>
          <button
            onClick={() => { setError(null); setOverlay('add') }}
            className="flex items-center gap-1 text-[12px] font-medium text-indigo-600 hover:text-indigo-700"
          >
            <Plus size={13} /> Add
          </button>
        </div>

        {needsMoreDirectors && journeyStep >= 2 && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-[12px] text-amber-700">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            <span>A minimum of 2 directors is required to proceed to Step 3.</span>
          </div>
        )}

        {error && (
          <div className="text-[12px] text-red-500 mb-2">{error}</div>
        )}

        {directors.length === 0 ? (
          <p className="text-[12.5px] text-gray-400 text-center py-3">
            No directors added yet. Use "Add" to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {directors.map((d) => (
              <div key={d.id} className="flex items-start justify-between gap-2 border border-gray-100 rounded-xl px-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-gray-900 truncate">{d.name}</div>
                  <div className="text-[11.5px] text-gray-400 mt-0.5 space-x-2">
                    {d.role && <span>{d.role}</span>}
                    {d.shareholdingPct != null && (
                      <span className="text-indigo-500 font-medium">{d.shareholdingPct}%</span>
                    )}
                  </div>
                  {d.din && (
                    <div className="text-[11px] text-gray-400 mt-0.5">DIN: {d.din}</div>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => { setError(null); setOverlay(d) }}
                    className="text-gray-400 hover:text-indigo-600 p-1"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="text-gray-400 hover:text-red-500 p-1"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {overlay === 'add' && (
        <DirectorFormOverlay
          onSubmit={handleAdd}
          onClose={() => setOverlay(null)}
          saving={saving}
        />
      )}

      {overlay && overlay !== 'add' && (
        <DirectorFormOverlay
          initial={{
            name: overlay.name ?? '',
            din: overlay.din ?? '',
            pan: overlay.pan ?? '',
            role: overlay.role ?? '',
            shareholdingPct: overlay.shareholdingPct ?? '',
            appointmentDate: overlay.appointmentDate ?? '',
            email: overlay.email ?? '',
            phone: overlay.phone ?? '',
          }}
          onSubmit={(payload) => handleUpdate(overlay.id, payload)}
          onClose={() => setOverlay(null)}
          saving={saving}
        />
      )}
    </>
  )
}
