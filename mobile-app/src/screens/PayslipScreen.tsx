import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { GlassCard } from '../components/ui/GlassCard';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PayslipRecord {
  id: string;
  period: string;         // "November 2024"
  month: string;          // "Nov"
  year: number;
  grossSalary: number;
  deductions: number;
  netPayable: number;
  status: 'processed' | 'pending' | 'draft';
  breakdown: {
    basic: number;
    hra: number;
    specialAllowance: number;
    performanceBonus: number;
    pf: number;
    esi: number;
    tds: number;
    professionalTax: number;
  };
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const PAYSLIPS: PayslipRecord[] = [
  {
    id: 'PS-2024-11',
    period: 'November 2024',
    month: 'Nov',
    year: 2024,
    grossSalary: 120000,
    deductions: 37550,
    netPayable: 82450,
    status: 'processed',
    breakdown: {
      basic: 60000,
      hra: 24000,
      specialAllowance: 26000,
      performanceBonus: 10000,
      pf: 7200,
      esi: 900,
      tds: 28000,
      professionalTax: 200,
    },
  },
  {
    id: 'PS-2024-10',
    period: 'October 2024',
    month: 'Oct',
    year: 2024,
    grossSalary: 110000,
    deductions: 34750,
    netPayable: 75250,
    status: 'processed',
    breakdown: {
      basic: 60000,
      hra: 24000,
      specialAllowance: 26000,
      performanceBonus: 0,
      pf: 7200,
      esi: 900,
      tds: 26400,
      professionalTax: 200,
    },
  },
  {
    id: 'PS-2024-09',
    period: 'September 2024',
    month: 'Sep',
    year: 2024,
    grossSalary: 110000,
    deductions: 34750,
    netPayable: 75250,
    status: 'processed',
    breakdown: {
      basic: 60000,
      hra: 24000,
      specialAllowance: 26000,
      performanceBonus: 0,
      pf: 7200,
      esi: 900,
      tds: 26400,
      professionalTax: 200,
    },
  },
  {
    id: 'PS-2024-08',
    period: 'August 2024',
    month: 'Aug',
    year: 2024,
    grossSalary: 110000,
    deductions: 34750,
    netPayable: 75250,
    status: 'processed',
    breakdown: {
      basic: 60000,
      hra: 24000,
      specialAllowance: 26000,
      performanceBonus: 0,
      pf: 7200,
      esi: 900,
      tds: 26400,
      professionalTax: 200,
    },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number): string =>
  '₹' + n.toLocaleString('en-IN');

// ── Components ────────────────────────────────────────────────────────────────

const SummaryCard = ({ payslip }: { payslip: PayslipRecord }) => (
  <GlassCard style={styles.summaryCard}>
    <Text style={styles.summaryPeriod}>{payslip.period}</Text>
    <View style={styles.summaryRow}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Gross</Text>
        <Text style={styles.summaryAmount}>{fmt(payslip.grossSalary)}</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Deductions</Text>
        <Text style={[styles.summaryAmount, { color: '#E85A2A' }]}>- {fmt(payslip.deductions)}</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Net Pay</Text>
        <Text style={[styles.summaryAmount, { color: '#10B981', fontSize: 18 }]}>{fmt(payslip.netPayable)}</Text>
      </View>
    </View>
  </GlassCard>
);

const BreakdownRow = ({ label, value, type }: { label: string; value: number; type: 'earning' | 'deduction' }) => (
  <View style={styles.breakdownRow}>
    <View style={styles.breakdownLeft}>
      <View style={[styles.breakdownDot, { backgroundColor: type === 'earning' ? '#10B981' : '#E85A2A' }]} />
      <Text style={styles.breakdownLabel}>{label}</Text>
    </View>
    <Text style={[styles.breakdownValue, { color: type === 'earning' ? '#FFFFFF' : '#E85A2A' }]}>
      {type === 'deduction' ? '- ' : '+ '}{fmt(value)}
    </Text>
  </View>
);

interface PayslipDetailProps {
  payslip: PayslipRecord;
  onClose: () => void;
}

const PayslipDetail = ({ payslip, onClose }: PayslipDetailProps) => {
  const { breakdown: b } = payslip;

  const handleDownload = () => {
    Alert.alert(
      'Download Payslip',
      `Payslip for ${payslip.period} would be downloaded as PDF.\n\n(PDF generation available when backend is connected)`,
      [{ text: 'OK' }]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Payslip — ${payslip.period}\nGross: ${fmt(payslip.grossSalary)}\nDeductions: ${fmt(payslip.deductions)}\nNet Pay: ${fmt(payslip.netPayable)}`,
        title: `Payslip ${payslip.period}`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.detailContainer}>
      {/* Header */}
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.detailTitle}>{payslip.period}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDownload} style={[styles.iconBtn, styles.iconBtnPrimary]}>
            <Text style={styles.iconBtnTextPrimary}>PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.detailScroll}>
        {/* Net Pay hero */}
        <GlassCard style={styles.netPayCard}>
          <Text style={styles.netPayLabel}>Net Pay</Text>
          <Text style={styles.netPayAmount}>{fmt(payslip.netPayable)}</Text>
          <Text style={styles.netPaySub}>Credited to your bank account</Text>
        </GlassCard>

        {/* Earnings */}
        <Text style={styles.sectionTitle}>Earnings</Text>
        <GlassCard style={styles.breakdownCard}>
          <BreakdownRow label="Basic Salary"         value={b.basic}             type="earning" />
          <BreakdownRow label="HRA"                  value={b.hra}               type="earning" />
          <BreakdownRow label="Special Allowance"    value={b.specialAllowance}  type="earning" />
          {b.performanceBonus > 0 && (
            <BreakdownRow label="Performance Bonus"  value={b.performanceBonus}  type="earning" />
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <Text style={styles.totalValue}>{fmt(payslip.grossSalary)}</Text>
          </View>
        </GlassCard>

        {/* Deductions */}
        <Text style={styles.sectionTitle}>Deductions</Text>
        <GlassCard style={styles.breakdownCard}>
          <BreakdownRow label="Provident Fund (PF)"  value={b.pf}               type="deduction" />
          <BreakdownRow label="ESI"                  value={b.esi}              type="deduction" />
          <BreakdownRow label="TDS"                  value={b.tds}              type="deduction" />
          <BreakdownRow label="Professional Tax"     value={b.professionalTax}  type="deduction" />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Deductions</Text>
            <Text style={[styles.totalValue, { color: '#E85A2A' }]}>- {fmt(payslip.deductions)}</Text>
          </View>
        </GlassCard>

        {/* Tax Regime */}
        <GlassCard style={styles.taxCard}>
          <Text style={styles.taxTitle}>Tax Regime: New Regime (FY 2024–25)</Text>
          <Text style={styles.taxSub}>Annual TDS estimated: {fmt(b.tds * 12)}</Text>
        </GlassCard>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────

export const PayslipScreen = () => {
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipRecord | null>(null);

  const ytdGross    = useMemo(() => PAYSLIPS.reduce((s, p) => s + p.grossSalary, 0), []);
  const ytdNet      = useMemo(() => PAYSLIPS.reduce((s, p) => s + p.netPayable, 0), []);
  const ytdTds      = useMemo(() => PAYSLIPS.reduce((s, p) => s + p.breakdown.tds, 0), []);

  if (selectedPayslip) {
    return <PayslipDetail payslip={selectedPayslip} onClose={() => setSelectedPayslip(null)} />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payslips</Text>
        <Text style={styles.headerSub}>Salary statements and tax details</Text>
      </View>

      {/* YTD Summary */}
      <Text style={styles.sectionTitle}>Year-to-Date Summary</Text>
      <View style={styles.ytdRow}>
        {[
          { label: 'YTD Gross',  value: fmt(ytdGross), color: '#F2AA3B' },
          { label: 'YTD Net',    value: fmt(ytdNet),   color: '#10B981' },
          { label: 'YTD TDS',    value: fmt(ytdTds),   color: '#E85A2A' },
        ].map((item) => (
          <GlassCard key={item.label} style={styles.ytdCard}>
            <Text style={[styles.ytdAmount, { color: item.color }]}>{item.value}</Text>
            <Text style={styles.ytdLabel}>{item.label}</Text>
          </GlassCard>
        ))}
      </View>

      {/* Payslip list */}
      <Text style={styles.sectionTitle}>Recent Payslips</Text>
      {PAYSLIPS.map((ps) => (
        <TouchableOpacity key={ps.id} onPress={() => setSelectedPayslip(ps)} activeOpacity={0.85}>
          <GlassCard style={styles.payslipRow}>
            {/* Month badge */}
            <View style={styles.monthBadge}>
              <Text style={styles.monthText}>{ps.month}</Text>
              <Text style={styles.yearText}>{ps.year}</Text>
            </View>

            {/* Details */}
            <View style={styles.payslipInfo}>
              <Text style={styles.payslipPeriod}>{ps.period}</Text>
              <View style={styles.payslipAmounts}>
                <Text style={styles.payslipGross}>Gross: {fmt(ps.grossSalary)}</Text>
                <Text style={styles.payslipNet}>Net: <Text style={{ color: '#10B981' }}>{fmt(ps.netPayable)}</Text></Text>
              </View>
            </View>

            {/* Status */}
            <View style={styles.processedBadge}>
              <Text style={styles.processedText}>✓</Text>
            </View>
          </GlassCard>
        </TouchableOpacity>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#02060f' },
  header:           { padding: 20, paddingTop: 60 },
  headerTitle:      { fontSize: 24, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSub:        { fontSize: 13, color: '#64748B', marginTop: 2 },
  sectionTitle:     { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1.2, marginHorizontal: 20, marginTop: 20, marginBottom: 10 },

  ytdRow:           { flexDirection: 'row', marginHorizontal: 16, gap: 10 },
  ytdCard:          { flex: 1, alignItems: 'center', paddingVertical: 14 },
  ytdAmount:        { fontSize: 13, fontWeight: '800' },
  ytdLabel:         { fontSize: 10, color: '#64748B', marginTop: 4, textAlign: 'center' },

  payslipRow:       { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 10, gap: 14 },
  monthBadge:       { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(242,170,59,0.12)', borderWidth: 1, borderColor: 'rgba(242,170,59,0.25)', alignItems: 'center', justifyContent: 'center' },
  monthText:        { fontSize: 13, fontWeight: '800', color: '#F2AA3B' },
  yearText:         { fontSize: 9, color: '#F2AA3B', opacity: 0.7 },
  payslipInfo:      { flex: 1 },
  payslipPeriod:    { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  payslipAmounts:   { flexDirection: 'row', gap: 12 },
  payslipGross:     { fontSize: 11, color: '#64748B' },
  payslipNet:       { fontSize: 11, color: '#94A3B8' },
  processedBadge:   { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(16,185,129,0.15)', alignItems: 'center', justifyContent: 'center' },
  processedText:    { color: '#10B981', fontWeight: '800', fontSize: 13 },

  summaryCard:      { marginBottom: 12 },
  summaryPeriod:    { fontSize: 12, color: '#64748B', marginBottom: 12, fontWeight: '600' },
  summaryRow:       { flexDirection: 'row', alignItems: 'center' },
  summaryItem:      { flex: 1, alignItems: 'center' },
  summaryLabel:     { fontSize: 10, color: '#64748B', marginBottom: 4 },
  summaryAmount:    { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  summaryDivider:   { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.06)' },

  detailContainer:  { flex: 1, backgroundColor: '#02060f' },
  detailHeader:     { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, gap: 12 },
  backBtn:          { paddingVertical: 8 },
  backBtnText:      { color: '#F2AA3B', fontWeight: '700', fontSize: 14 },
  detailTitle:      { flex: 1, fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  headerActions:    { flexDirection: 'row', gap: 8 },
  iconBtn:          { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  iconBtnText:      { color: '#94A3B8', fontWeight: '700', fontSize: 12 },
  iconBtnPrimary:   { backgroundColor: '#F2AA3B' },
  iconBtnTextPrimary: { color: '#02060f', fontWeight: '800', fontSize: 12 },
  detailScroll:     { flex: 1 },

  netPayCard:       { marginHorizontal: 20, alignItems: 'center', paddingVertical: 28 },
  netPayLabel:      { fontSize: 12, color: '#64748B', fontWeight: '600', marginBottom: 8 },
  netPayAmount:     { fontSize: 36, fontWeight: '900', color: '#10B981', letterSpacing: -1 },
  netPaySub:        { fontSize: 11, color: '#475569', marginTop: 6 },

  breakdownCard:    { marginHorizontal: 20 },
  breakdownRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  breakdownLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  breakdownDot:     { width: 6, height: 6, borderRadius: 3 },
  breakdownLabel:   { fontSize: 13, color: '#94A3B8' },
  breakdownValue:   { fontSize: 13, fontWeight: '700' },
  totalRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4 },
  totalLabel:       { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  totalValue:       { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },

  taxCard:          { marginHorizontal: 20, marginTop: 16, backgroundColor: 'rgba(242,170,59,0.05)', borderWidth: 1, borderColor: 'rgba(242,170,59,0.15)' },
  taxTitle:         { fontSize: 13, fontWeight: '700', color: '#F2AA3B', marginBottom: 4 },
  taxSub:           { fontSize: 12, color: '#94A3B8' },
});
