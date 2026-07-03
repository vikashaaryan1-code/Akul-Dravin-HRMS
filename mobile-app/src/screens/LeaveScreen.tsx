import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { GlassCard } from '../components/ui/GlassCard';

// ── Types ─────────────────────────────────────────────────────────────────────

type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
type LeaveType = 'Casual Leave' | 'Sick Leave' | 'Earned Leave' | 'Maternity Leave' | 'Paternity Leave';

interface LeaveRequest {
  id: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  approver?: string;
  approverNote?: string;
}

interface LeaveBalance {
  type: LeaveType;
  total: number;
  used: number;
  balance: number;
  color: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const LEAVE_BALANCES: LeaveBalance[] = [
  { type: 'Casual Leave',    total: 12, used: 4,  balance: 8,  color: '#F2AA3B' },
  { type: 'Sick Leave',      total: 12, used: 2,  balance: 10, color: '#0F8B8D' },
  { type: 'Earned Leave',    total: 18, used: 5,  balance: 13, color: '#10B981' },
  { type: 'Paternity Leave', total: 5,  used: 0,  balance: 5,  color: '#8B5CF6' },
];

const LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'L-001',
    leaveType: 'Casual Leave',
    startDate: '2024-12-25',
    endDate: '2024-12-26',
    days: 2,
    reason: 'Christmas holiday with family',
    status: 'approved',
    appliedOn: '2024-12-10',
    approver: 'Priya Sharma',
    approverNote: 'Approved. Enjoy the holidays!',
  },
  {
    id: 'L-002',
    leaveType: 'Sick Leave',
    startDate: '2024-12-19',
    endDate: '2024-12-19',
    days: 1,
    reason: 'Medical appointment - Routine checkup',
    status: 'pending',
    appliedOn: '2024-12-15',
    approver: 'Priya Sharma',
  },
  {
    id: 'L-003',
    leaveType: 'Earned Leave',
    startDate: '2024-11-28',
    endDate: '2024-11-30',
    days: 3,
    reason: 'Personal travel',
    status: 'approved',
    appliedOn: '2024-11-15',
    approver: 'Ravi Kumar',
  },
  {
    id: 'L-004',
    leaveType: 'Casual Leave',
    startDate: '2024-11-01',
    endDate: '2024-11-01',
    days: 1,
    reason: 'Personal work',
    status: 'rejected',
    appliedOn: '2024-10-29',
    approver: 'Priya Sharma',
    approverNote: 'Insufficient notice period. Please apply at least 3 days in advance.',
  },
];

const STATUS_CONFIG: Record<LeaveStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: '#F2AA3B', bg: 'rgba(242,170,59,0.15)'  },
  approved:  { label: 'Approved',  color: '#10B981', bg: 'rgba(16,185,129,0.15)'  },
  rejected:  { label: 'Rejected',  color: '#E85A2A', bg: 'rgba(232,90,42,0.15)'   },
  cancelled: { label: 'Cancelled', color: '#64748B', bg: 'rgba(100,116,139,0.15)' },
};

// ── Components ────────────────────────────────────────────────────────────────

const BalanceCard = ({ item }: { item: LeaveBalance }) => {
  const pct = ((item.balance / item.total) * 100).toFixed(0);
  return (
    <View style={[styles.balanceCard, { borderColor: item.color + '30' }]}>
      <View style={[styles.balanceDot, { backgroundColor: item.color }]} />
      <Text style={styles.balanceType} numberOfLines={1}>{item.type}</Text>
      <Text style={[styles.balanceNum, { color: item.color }]}>{item.balance}</Text>
      <Text style={styles.balanceOf}>/ {item.total} days</Text>
      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: item.color }]} />
      </View>
    </View>
  );
};

interface ApplyLeaveModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<LeaveRequest>) => void;
}

const ApplyLeaveModal = ({ visible, onClose, onSubmit }: ApplyLeaveModalProps) => {
  const [leaveType, setLeaveType] = useState<LeaveType>('Casual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const leaveTypes: LeaveType[] = ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Paternity Leave'];

  const handleSubmit = async () => {
    if (!startDate || !endDate || !reason.trim()) {
      Alert.alert('Incomplete', 'Please fill all required fields.');
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000)); // Simulate API
    onSubmit({ leaveType, startDate, endDate, reason, status: 'pending' });
    setSubmitting(false);
    setStartDate('');
    setEndDate('');
    setReason('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Apply for Leave</Text>

          {/* Leave Type */}
          <Text style={styles.fieldLabel}>Leave Type *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
            {leaveTypes.map((lt) => (
              <TouchableOpacity
                key={lt}
                onPress={() => setLeaveType(lt)}
                style={[styles.typeChip, leaveType === lt && styles.typeChipActive]}
              >
                <Text style={[styles.typeChipText, leaveType === lt && styles.typeChipTextActive]}>
                  {lt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Dates */}
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>Start Date *</Text>
              <TextInput
                style={styles.input}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#475569"
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>End Date *</Text>
              <TextInput
                style={styles.input}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#475569"
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          {/* Reason */}
          <Text style={styles.fieldLabel}>Reason *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={reason}
            onChangeText={setReason}
            placeholder="Brief reason for leave..."
            placeholderTextColor="#475569"
            multiline
            numberOfLines={3}
          />

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? 'Submitting…' : 'Submit Request'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const LeaveRequestCard = ({ item }: { item: LeaveRequest }) => {
  const [expanded, setExpanded] = useState(false);
  const st = STATUS_CONFIG[item.status];

  return (
    <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.85}>
      <GlassCard style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.requestLeft}>
            <Text style={styles.requestType}>{item.leaveType}</Text>
            <Text style={styles.requestDates}>
              {item.startDate} → {item.endDate}
            </Text>
            <Text style={styles.requestDays}>{item.days} day{item.days > 1 ? 's' : ''}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        {expanded && (
          <View style={styles.requestExpanded}>
            <Text style={styles.expandedLabel}>Reason</Text>
            <Text style={styles.expandedValue}>{item.reason}</Text>

            {item.approver && (
              <>
                <Text style={styles.expandedLabel}>Approver</Text>
                <Text style={styles.expandedValue}>{item.approver}</Text>
              </>
            )}

            {item.approverNote && (
              <>
                <Text style={styles.expandedLabel}>Note</Text>
                <Text style={[styles.expandedValue, {
                  color: item.status === 'rejected' ? '#E85A2A' : '#10B981',
                }]}>{item.approverNote}</Text>
              </>
            )}

            <Text style={styles.expandedLabel}>Applied On</Text>
            <Text style={styles.expandedValue}>{item.appliedOn}</Text>
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────

export const LeaveScreen = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>(LEAVE_REQUESTS);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filtered = useMemo(() => {
    if (activeTab === 'all') return requests;
    return requests.filter((r) => r.status === activeTab);
  }, [requests, activeTab]);

  const handleNewRequest = (data: Partial<LeaveRequest>) => {
    const newReq: LeaveRequest = {
      id: `L-${String(Date.now()).slice(-4)}`,
      leaveType: data.leaveType ?? 'Casual Leave',
      startDate: data.startDate ?? '',
      endDate: data.endDate ?? '',
      days: 1,
      reason: data.reason ?? '',
      status: 'pending',
      appliedOn: new Date().toISOString().slice(0, 10),
    };
    setRequests((prev) => [newReq, ...prev]);
    Alert.alert('✅ Request Submitted', 'Your leave request has been sent for approval.');
  };

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'all',      label: 'All'      },
    { key: 'pending',  label: 'Pending'  },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Leave Management</Text>
          <Text style={styles.headerSub}>Track and manage your leave requests</Text>
        </View>
        <TouchableOpacity style={styles.applyBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.applyBtnText}>+ Apply</Text>
        </TouchableOpacity>
      </View>

      {/* Balance Cards */}
      <Text style={styles.sectionTitle}>Leave Balance</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.balanceScroll}>
        {LEAVE_BALANCES.map((b) => (
          <BalanceCard key={b.type} item={b} />
        ))}
      </ScrollView>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Request list */}
      <Text style={styles.sectionTitle}>Your Requests ({filtered.length})</Text>
      {filtered.length === 0 ? (
        <GlassCard style={styles.emptyCard}>
          <Text style={styles.emptyText}>No {activeTab} requests found</Text>
        </GlassCard>
      ) : (
        filtered.map((req) => <LeaveRequestCard key={req.id} item={req} />)
      )}

      <View style={{ height: 40 }} />

      {/* Apply Modal */}
      <ApplyLeaveModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleNewRequest}
      />
    </ScrollView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#02060f' },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60 },
  headerTitle:     { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSub:       { fontSize: 13, color: '#64748B', marginTop: 2 },
  applyBtn:        { backgroundColor: '#F2AA3B', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  applyBtnText:    { color: '#02060f', fontWeight: '800', fontSize: 13 },

  sectionTitle:    { fontSize: 13, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: 20, marginTop: 16, marginBottom: 10 },

  balanceScroll:   { paddingLeft: 20 },
  balanceCard:     { width: 140, marginRight: 12, borderRadius: 20, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 16 },
  balanceDot:      { width: 8, height: 8, borderRadius: 4, marginBottom: 10 },
  balanceType:     { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 8 },
  balanceNum:      { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  balanceOf:       { fontSize: 11, color: '#475569', marginTop: 2, marginBottom: 10 },
  progressBg:      { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 9999 },
  progressFill:    { height: 4, borderRadius: 9999 },

  tabs:            { flexDirection: 'row', marginHorizontal: 20, marginTop: 8, marginBottom: 4, gap: 6 },
  tab:             { flex: 1, borderRadius: 12, paddingVertical: 8, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tabActive:       { backgroundColor: 'rgba(242,170,59,0.15)', borderColor: 'rgba(242,170,59,0.35)' },
  tabText:         { fontSize: 11, fontWeight: '600', color: '#475569' },
  tabTextActive:   { color: '#F2AA3B' },

  requestCard:     { marginHorizontal: 20, marginBottom: 10 },
  requestHeader:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  requestLeft:     { flex: 1 },
  requestType:     { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  requestDates:    { fontSize: 12, color: '#64748B' },
  requestDays:     { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  statusBadge:     { borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:      { fontSize: 11, fontWeight: '700' },

  requestExpanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  expandedLabel:   { fontSize: 10, fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  expandedValue:   { fontSize: 13, color: '#CBD5E1', marginBottom: 10 },

  emptyCard:       { marginHorizontal: 20, alignItems: 'center', padding: 32 },
  emptyText:       { color: '#475569', fontSize: 13 },

  // Modal
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalSheet:      { backgroundColor: '#0d1a30', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  modalHandle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 20 },
  modalTitle:      { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 20 },
  fieldLabel:      { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 12 },
  typeScroll:      { marginHorizontal: -4 },
  typeChip:        { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginHorizontal: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  typeChipActive:  { backgroundColor: 'rgba(242,170,59,0.15)', borderColor: 'rgba(242,170,59,0.4)' },
  typeChipText:    { fontSize: 12, fontWeight: '600', color: '#475569' },
  typeChipTextActive: { color: '#F2AA3B' },
  dateRow:         { flexDirection: 'row', gap: 12 },
  dateField:       { flex: 1 },
  input:           { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', paddingHorizontal: 14, paddingVertical: 12, color: '#FFFFFF', fontSize: 13 },
  textArea:        { height: 80, textAlignVertical: 'top' },
  modalActions:    { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn:       { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cancelBtnText:   { color: '#94A3B8', fontWeight: '700', fontSize: 14 },
  submitBtn:       { flex: 2, borderRadius: 16, paddingVertical: 14, alignItems: 'center', backgroundColor: '#F2AA3B' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText:   { color: '#02060f', fontWeight: '800', fontSize: 14 },
});
