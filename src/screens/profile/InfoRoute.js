import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Animated, SafeAreaView } from "react-native";
import Axios from "axios";
import { ScrollView } from "react-native-gesture-handler";
import Colors from "../../../assets/Colors";
import { APP_ENV } from "../../../src/utils/BaseUrl";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from '@expo/vector-icons';

const InfoRoute = ({ userId }) => {
  const { t } = useTranslation();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const fetchProfileData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const userinformations = await Axios.get(
        `${APP_ENV.AUTH_PORT}/tawasalna-user/user/${userId}`
      );
    
      const residentData = response.data;
      const userCommunity = userinformations.data?.community?.name || null;
      console.log(residentData)
      setProfileData({ ...residentData, community: userCommunity });
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  // Initialize animations
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  const renderEmptyState = () => (
    <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
      <View style={styles.emptyIconContainer}>
        <MaterialCommunityIcons name="account-details" size={48} color={Colors.LIGHT_PURPLE} />
      </View>
      <Text style={styles.emptyTitle}>No information available</Text>
      <Text style={styles.emptySubtitle}>
        Complete your profile to see your information here
      </Text>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.LIGHT_PURPLE} />
        <Text style={styles.loadingText}>Loading information...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContent} 
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {!profileData ? (
          renderEmptyState()
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="account" size={24} color={Colors.LIGHT_PURPLE} />
                <Text style={styles.sectionTitle}>{t("Personal Information")}</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <MaterialCommunityIcons name="calendar" size={16} color="#6B7280" />
                  <Text style={styles.infoLabel}>{t("Age")}:</Text>
                </View>
                <Text style={styles.infoValue}>{profileData?.age || "-"}</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <MaterialCommunityIcons name="gender-male-female" size={16} color="#6B7280" />
                  <Text style={styles.infoLabel}>{t("Gender")}:</Text>
                </View>
                <Text style={styles.infoValue}>{profileData?.gender ? t(profileData.gender) : "-"}</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <MaterialCommunityIcons name="cake-variant" size={16} color="#6B7280" />
                  <Text style={styles.infoLabel}>{t("Date of Birth")}:</Text>
                </View>
                <Text style={styles.infoValue}>
                  {profileData?.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString() : "-"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <MaterialCommunityIcons name="map-marker" size={16} color="#6B7280" />
                  <Text style={styles.infoLabel}>{t("Address")}:</Text>
                </View>
                <Text style={styles.infoValue}>{profileData?.address || t("No address provided")}</Text>
              </View>
            </View>

            {profileData?.interests && profileData.interests.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="heart" size={24} color={Colors.LIGHT_PURPLE} />
                  <Text style={styles.sectionTitle}>{t("Interests")}</Text>
                </View>
                <View style={styles.interestsContainer}>
                  {profileData.interests.map((interest, index) => (
                    <View key={index} style={styles.interestTag}>
                      <Text style={styles.interestText}>{t(interest)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="account-group" size={24} color={Colors.LIGHT_PURPLE} />
                <Text style={styles.sectionTitle}>{t("Community")}</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <MaterialCommunityIcons name="home" size={16} color="#6B7280" />
                  <Text style={styles.infoLabel}>{t("Community name")}:</Text>
                </View>
                <Text style={styles.infoValue}>{profileData?.community || "-"}</Text>
              </View>
            </View>
          </>
        )}
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: '#1F2937',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: "500",
    marginLeft: 6,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    flexShrink: 1,
    maxWidth: "50%",
    textAlign: "right",
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestTag: {
    backgroundColor: Colors.LIGHT_PURPLE,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: Colors.LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  interestText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: '600',
  },
});

export default InfoRoute;