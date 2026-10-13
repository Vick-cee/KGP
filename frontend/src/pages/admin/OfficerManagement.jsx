import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import {
  ShieldCheck,
  UserPlus,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Edit2,
  Radio,
  Trash2,
  UserMinus,
  LogIn,
  LogOut,
} from 'lucide-react';

export const OfficerManagement = () => {
  const [officers, setOfficers] = useState([]);
  const [gates, setGates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [assigningOfficer, setAssigningOfficer] = useState(null);
  const [deletingOfficer, setDeletingOfficer] = useState(null);

  const [newOfficer, setNewOfficer] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: 'Password123!',
    badgeNumber: '',
    assignedGateId: '',
    shift: 'MORNING',
  });

  const [assignData, setAssignData] = useState({
    gateId: '',
    shift: 'MORNING',
    status: 'ON_DUTY',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [offRes, gateRes] = await Promise.all([
        api.get('/gates/officers'),
        api.get('/gates'),
      ]);
      setOfficers(offRes.data.officers || []);
      setGates(gateRes.data.gates || []);
    } catch (err) {
      console.error('Failed to load officers/gates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/gates/officers', newOfficer);
      setFeedback({
        type: 'success',
        message: `Gate Officer ${newOfficer.fullName} registered successfully!`,
      });
      setShowAddModal(false);
      setNewOfficer({
        fullName: '',
        email: '',
        phone: '',
        password: 'Password123!',
        badgeNumber: '',
        assignedGateId: '',
        shift: 'MORNING',
      });
      await fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create officer' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAssign = (officer) => {
    setAssigningOfficer(officer);
    setAssignData({
      gateId: officer.assignedGateId?._id || '',
      shift: officer.shift || 'MORNING',
      status: officer.status || 'ON_DUTY',
    });
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.put(`/gates/officers/${assigningOfficer._id}/assign`, {
        gateId: assignData.gateId || null,
        shift: assignData.shift,
        status: assignData.status,
      });
      setFeedback({
        type: 'success',
        message: `Gate assignment updated for ${assigningOfficer.userId?.fullName}.`,
      });
      setAssigningOfficer(null);
      await fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update assignment' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnassignOfficer = async (officer) => {
    if (!window.confirm(`Unassign ${officer.userId?.fullName} from their current gate terminal?`)) return;
    setActionLoading(true);
    try {
      await api.put(`/gates/officers/${officer._id}/unassign`);
      setFeedback({
        type: 'success',
        message: `Officer ${officer.userId?.fullName} unassigned from gate.`,
      });
      await fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to unassign officer' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOfficer = async (officer) => {
    if (!window.confirm(`Are you sure you want to completely remove security officer ${officer.userId?.fullName} from the system?`)) return;
    setActionLoading(true);
    try {
      await api.delete(`/gates/officers/${officer._id}`);
      setFeedback({
        type: 'success',
        message: `Officer ${officer.userId?.fullName} has been removed.`,
      });
      await fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete officer' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-kasu-red-800" />
            KASU Gate Officers & Duty Assignments
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Assign or remove security officers between the Two Campus Gates (Entry & Exit) at any time.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-xs"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-kasu-red-800 hover:bg-kasu-red-900 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" /> Register New Officer
          </button>
        </div>
      </div>

      {feedback.message && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2 font-bold ${
            feedback.type === 'success'
              ? 'bg-kasu-green-50 text-kasu-green-900 border border-kasu-green-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-kasu-green-700 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Officers Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-medium">Loading gate officers...</div>
        ) : officers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 font-medium">No gate officers registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Badge Number</th>
                  <th className="py-3.5 px-4">Officer Name</th>
                  <th className="py-3.5 px-4">Assigned Duty Gate</th>
                  <th className="py-3.5 px-4">Assigned Shift</th>
                  <th className="py-3.5 px-4">Duty Status</th>
                  <th className="py-3.5 px-4 text-right">Gate Assignment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {officers.map((off) => (
                  <tr key={off._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-black text-kasu-red-800">
                      {off.badgeNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{off.userId?.fullName || 'N/A'}</div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {off.userId?.email} &bull; {off.userId?.phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {off.assignedGateId ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1 rounded-lg ${
                              off.assignedGateId.code === 'GATE-ENTRY'
                                ? 'bg-kasu-green-100 text-kasu-green-800'
                                : 'bg-kasu-red-100 text-kasu-red-800'
                            }`}
                          >
                            {off.assignedGateId.code === 'GATE-ENTRY' ? (
                              <LogIn className="w-3.5 h-3.5" />
                            ) : (
                              <LogOut className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900">{off.assignedGateId.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono font-semibold">
                              {off.assignedGateId.code} ({off.assignedGateId.code === 'GATE-ENTRY' ? 'Inbound Check-In' : 'Outbound Check-Out'})
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                          Unassigned (Reserve)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      {off.shift} SHIFT
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          off.status === 'ON_DUTY'
                            ? 'bg-kasu-green-100 text-kasu-green-800 border border-kasu-green-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <Radio className="w-2.5 h-2.5" />
                        {off.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAssign(off)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] transition inline-flex items-center gap-1 border border-slate-200"
                          title="Assign or change duty gate"
                        >
                          <Edit2 className="w-3 h-3 text-kasu-red-700" /> Assign Gate
                        </button>

                        {off.assignedGateId && (
                          <button
                            onClick={() => handleUnassignOfficer(off)}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] transition border border-amber-200"
                            title="Remove from assigned gate"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteOfficer(off)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition border border-rose-200"
                          title="Delete officer account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Officer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateOfficer}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">Register Security Officer</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newOfficer.fullName}
                  onChange={(e) => setNewOfficer({ ...newOfficer, fullName: e.target.value })}
                  placeholder="e.g. Officer James Wilson"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Badge Number *</label>
                  <input
                    type="text"
                    required
                    value={newOfficer.badgeNumber}
                    onChange={(e) =>
                      setNewOfficer({ ...newOfficer, badgeNumber: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. KASU-SEC-105"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold uppercase text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Shift *</label>
                  <select
                    value={newOfficer.shift}
                    onChange={(e) => setNewOfficer({ ...newOfficer, shift: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                  >
                    <option value="MORNING">MORNING</option>
                    <option value="AFTERNOON">AFTERNOON</option>
                    <option value="NIGHT">NIGHT</option>
                    <option value="ROTATING">ROTATING</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Officer Email *</label>
                <input
                  type="email"
                  required
                  value={newOfficer.email}
                  onChange={(e) => setNewOfficer({ ...newOfficer, email: e.target.value })}
                  placeholder="officer@kasu.edu.ng"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={newOfficer.phone}
                  onChange={(e) => setNewOfficer({ ...newOfficer, phone: e.target.value })}
                  placeholder="+234 800 000 0000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Assign to Gate</label>
                <select
                  value={newOfficer.assignedGateId}
                  onChange={(e) => setNewOfficer({ ...newOfficer, assignedGateId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                >
                  <option value="">Leave Unassigned (Reserve)</option>
                  {gates.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name} ({g.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-kasu-red-800 text-white font-bold text-xs hover:bg-kasu-red-900 transition shadow"
              >
                {actionLoading ? 'Creating...' : 'Register Officer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reassign / Assign Modal */}
      {assigningOfficer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveAssignment}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  Assign Gate Duty
                </h3>
                <div className="text-xs text-slate-500 font-semibold">{assigningOfficer.userId?.fullName} ({assigningOfficer.badgeNumber})</div>
              </div>
              <button
                type="button"
                onClick={() => setAssigningOfficer(null)}
                className="p-1 text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Target Gate Station *</label>
                <select
                  value={assignData.gateId}
                  onChange={(e) => setAssignData({ ...assignData, gateId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                >
                  <option value="">None (Unassign from Gate)</option>
                  {gates.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name} ({g.code} &bull; {g.code === 'GATE-ENTRY' ? 'Inbound Check-In' : 'Outbound Check-Out'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Assigned Shift</label>
                <select
                  value={assignData.shift}
                  onChange={(e) => setAssignData({ ...assignData, shift: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                >
                  <option value="MORNING">MORNING SHIFT (06:00 - 14:00)</option>
                  <option value="AFTERNOON">AFTERNOON SHIFT (14:00 - 22:00)</option>
                  <option value="NIGHT">NIGHT SHIFT (22:00 - 06:00)</option>
                  <option value="ROTATING">ROTATING SHIFT</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Duty Status</label>
                <select
                  value={assignData.status}
                  onChange={(e) => setAssignData({ ...assignData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                >
                  <option value="ON_DUTY">ON DUTY (Active at Terminal)</option>
                  <option value="OFF_DUTY">OFF DUTY</option>
                  <option value="ON_LEAVE">ON LEAVE</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setAssigningOfficer(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-kasu-red-800 text-white font-bold text-xs hover:bg-kasu-red-900 transition shadow"
              >
                {actionLoading ? 'Saving...' : 'Save Gate Assignment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default OfficerManagement;
