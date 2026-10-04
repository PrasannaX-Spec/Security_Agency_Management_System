import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getMe } from '../api/auth';
import { colors } from '../theme/colors';
import { User, LogOut, ShieldCheck, Building, Phone, Mail, BadgeCheck } from 'lucide-react-native';

export default function ProfileScreen({ navigation }) {
  const { user: initialUser, logout } = useAuth();
  const [profile, setProfile] = useState(initialUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchLiveProfile() {
      setLoading(true);
      try {
        const liveData = await getMe();
        if (liveData) setProfile(liveData);
      } catch {
        // Fallback to cached context user
      } finally {
        setLoading(false);
      }
    }
    fetchLiveProfile();
  }, []);

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'System Administrator';
      case 'SUPERVISOR':
        return 'Field Supervisor';
      case 'CLIENT':
        return 'Client Portal User';
      case 'GUARD':
      default:
        return 'Security Officer';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>User Profile</Text>
          <Text style={styles.subtitle}>Verified account details and active operational session.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.avatarCircle}>
            <User size={32} color={colors.accent} />
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 8 }} />
          ) : (
            <>
              <Text style={styles.userName}>
                {profile?.first_name || profile?.last_name
                  ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                  : profile?.username}
              </Text>
              <View style={styles.roleBadge}>
                <ShieldCheck size={12} color={colors.accent} />
                <Text style={styles.userRole}>{getRoleDisplayName(profile?.role)}</Text>
              </View>
            </>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Status</Text>
            <Text style={[styles.infoValue, { color: profile?.status === 'ACTIVE' ? '#10B981' : '#EF4444' }]}>
              {profile?.status || 'ACTIVE'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{profile?.username}</Text>
          </View>

          {profile?.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profile.email}</Text>
            </View>
          )}

          {profile?.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{profile.phone}</Text>
            </View>
          )}

          <View style={styles.linksRow}>
            <TouchableOpacity onPress={() => navigation.navigate('Terms')} activeOpacity={0.7}>
              <Text style={styles.linkText}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.divider}>·</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Privacy')} activeOpacity={0.7}>
              <Text style={styles.linkText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
            <LogOut size={16} color={colors.danger} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 6,
    marginBottom: 16,
  },
  userRole: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    marginBottom: 18,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
  },
  linkText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '500',
  },
  divider: {
    color: colors.textMuted,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
});
