import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

const PRESET_DESTINATIONS = [
  { name: 'City Center Hub', latitude: 28.6139, longitude: 77.2090 },
  { name: 'Tech Park Campus', latitude: 28.5355, longitude: 77.3910 },
  { name: 'Central Station', latitude: 28.6448, longitude: 77.2194 },
  { name: 'International Airport', latitude: 28.5562, longitude: 77.1000 },
];

export default function DestinationModal({ visible, onClose, onSelectDestination }) {
  const [inputText, setInputText] = useState('');

  const handleCustomSubmit = () => {
    if (!inputText.trim()) return;
    onSelectDestination({
      name: inputText.trim(),
      latitude: 28.6139 + (Math.random() - 0.5) * 0.05,
      longitude: 77.2090 + (Math.random() - 0.5) * 0.05,
    });
    setInputText('');
  };

  const handlePresetSelect = (preset) => {
    onSelectDestination(preset);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Set Destination</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Enter Address or Location Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 124 Grand Avenue or Office..."
              placeholderTextColor="#64748b"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleCustomSubmit}
            />
            <TouchableOpacity 
              style={styles.confirmBtn}
              onPress={handleCustomSubmit}
            >
              <Text style={styles.confirmBtnText}>Set</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { marginTop: 20 }]}>Popular Destination Presets</Text>
          <FlatList
            data={PRESET_DESTINATIONS}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.presetCard}
                onPress={() => handlePresetSelect(item)}
              >
                <View style={styles.presetIcon}>
                  <Text style={{ fontSize: 18 }}>📍</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.presetName}>{item.name}</Text>
                  <Text style={styles.presetCoords}>
                    {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                  </Text>
                </View>
                <Text style={styles.arrowText}>→</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  confirmBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetName: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  presetCoords: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  arrowText: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: '700',
  }
});
