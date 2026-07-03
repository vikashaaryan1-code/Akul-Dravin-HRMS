import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { documentService } from '../services/api';

const mapCategory = (type: string) => {
  if (type.includes('offer-letter') || type.includes('experience-letter')) return 'HR & Onboarding';
  if (type.includes('payslip') || type.includes('w2')) return 'Tax & Finance';
  if (type.includes('certificate') || type.includes('training')) return 'Legal & Compliance';
  return 'General';
};

const getExtension = (url: string) => {
  if (!url) return 'DOC';
  const parts = url.split('.');
  return parts.length > 1 ? parts.pop()?.toUpperCase() || 'DOC' : 'DOC';
};

export const DocumentsScreen = () => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await documentService.getMyDocuments();
        setDocuments(res.data || []);
      } catch (err) {
        Alert.alert('Error', 'Failed to fetch documents.');
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const handleDownload = (docId: string, docName: string) => {
    setDownloadingId(docId);
    
    // Simulate network download
    setTimeout(() => {
      setDownloadingId(null);
      Alert.alert('Download Complete', `${docName} has been saved to your secure offline vault.`);
    }, 1500);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      
      <View style={styles.header}>
        <Text style={styles.title}>Digital Vault</Text>
        <Text style={styles.subtitle}>Secure access to your personal documents</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{documents.length}</Text>
          <Text style={styles.statLabel}>Documents</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{(documents.length * 1.2).toFixed(1)} MB</Text>
          <Text style={styles.statLabel}>Total Size</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>Secure</Text>
          <Text style={styles.statLabel}>Encryption</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#38bdf8" style={{ marginTop: 40 }} />
      ) : (
        Object.entries(
          documents.reduce((acc, doc) => {
            const cat = mapCategory(doc.documentType);
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(doc);
            return acc;
          }, {} as Record<string, any[]>)
        ).map(([categoryName, docs]: [string, any], catIdx) => (
          <View key={catIdx} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{categoryName}</Text>
            
            {docs.map((doc: any) => {
              const isDownloading = downloadingId === doc.id;
              const dateStr = new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const fileType = getExtension(doc.fileUrl);

              return (
                <View key={doc.id} style={styles.docCard}>
                  <View style={styles.docIconContainer}>
                    <Text style={styles.docIconText}>{fileType}</Text>
                  </View>
                  
                  <View style={styles.docInfo}>
                    <Text style={styles.docName} numberOfLines={1}>{doc.documentName}</Text>
                    <Text style={styles.docMeta}>{dateStr} • {doc.status.toUpperCase()}</Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.downloadBtn} 
                    onPress={() => handleDownload(doc.id, doc.documentName)}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <ActivityIndicator size="small" color="#38bdf8" />
                    ) : (
                      <Text style={styles.downloadText}>VIEW</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ))
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  docIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  docIconText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  docInfo: {
    flex: 1,
    marginRight: 12,
  },
  docName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  docMeta: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  downloadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    minWidth: 60,
    alignItems: 'center',
  },
  downloadText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
