import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { submitPaymentProof } from '@/firebase/payments';
import { colors } from '@/constants/colors';
import { spacing, fontSize, radius, fontWeight } from '@/constants/theme';
import { t } from '@/i18n';

type Props = {
  groupId: string;
  roundId: string;
  memberId: string;
  onSuccess: () => void;
};

export default function ProofUploader({ groupId, roundId, memberId, onSuccess }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), 'Camera permission denied');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.6,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function handleSubmit() {
    if (!imageUri) return;
    setUploading(true);
    try {
      await submitPaymentProof(groupId, roundId, memberId, imageUri);
      setImageUri(null);
      onSuccess();
      Alert.alert('완료', '납입 증빙이 제출되었습니다. 계주 승인을 기다려주세요.');
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.container}>
      {imageUri ? (
        <View style={styles.preview}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
              <Text style={styles.changeBtnText}>다시 선택</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, uploading && styles.disabled]}
              onPress={handleSubmit}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={colors.surface} size="small" />
              ) : (
                <Text style={styles.submitBtnText}>제출하기</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.picker}>
          <Text style={styles.pickerTitle}>{t('payment.uploadProof')}</Text>
          <Text style={styles.pickerHint}>{t('payment.proofRequired')}</Text>
          <View style={styles.pickerButtons}>
            <TouchableOpacity style={styles.pickerBtn} onPress={takePhoto}>
              <Text style={styles.pickerBtnIcon}>📷</Text>
              <Text style={styles.pickerBtnLabel}>촬영</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerBtn} onPress={pickImage}>
              <Text style={styles.pickerBtnIcon}>🖼️</Text>
              <Text style={styles.pickerBtnLabel}>갤러리</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  picker: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  pickerTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  pickerHint: { fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center' },
  pickerButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  pickerBtn: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  pickerBtnIcon: { fontSize: 28 },
  pickerBtnLabel: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  preview: { gap: spacing.md },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    resizeMode: 'cover',
  },
  previewActions: { flexDirection: 'row', gap: spacing.sm },
  changeBtn: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  changeBtnText: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  submitBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitBtnText: { fontSize: fontSize.sm, color: colors.surface, fontWeight: fontWeight.semibold },
  disabled: { opacity: 0.6 },
});
