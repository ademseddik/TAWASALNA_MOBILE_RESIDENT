import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import Axios from "axios";
import { ScrollView } from "react-native-gesture-handler";
import Colors from "../../../assets/Colors";
import { APP_ENV } from "../../../src/utils/BaseUrl";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GroupInfo = ({ id }) => { // Accept group as a prop

  const { t } = useTranslation();
  const [GroupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchGroupeData = async () => {

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/getGroupById${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const userinformations = await Axios.get(
         `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/getGroupById${id}`
      );
    
      const groupData = response.data;
      const userCommunity = userinformations.data?.community?.name || null;
      console.log(groupData)
      setGroupData({ ...groupData, community: userCommunity });
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupeData();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PURPLE} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.scene}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Personal Information")}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Age")}:</Text>
            <Text style={styles.infoValue}>{GroupData?.age || "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Gender")}:</Text>
            <Text style={styles.infoValue}>{GroupData?.gender ? t(GroupData.gender) : "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Date of Birth")}:</Text>
            <Text style={styles.infoValue}>
              {GroupData?.dateOfBirth ? new Date(GroupData.dateOfBirth).toLocaleDateString() : "-"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Address")}:</Text>
            <Text style={styles.infoValue}>{GroupData?.address || t("No address provided")}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Interests")}</Text>
          <View style={styles.interestsContainer}>
            {GroupData?.interests?.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{t(interest)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Community")}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Community name")}:</Text>
            <Text style={styles.infoValue}>{GroupData?.community || "-"}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scene: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 20 },
  scrollContent: { paddingBottom: 30, paddingHorizontal: 10 },
  section: { marginHorizontal: 10, marginBottom: 25, width: "100%", backgroundColor: Colors.LIGHT_WHITE, borderRadius: 10, padding: 15 },
  container: { backgroundColor: "white", marginTop: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15, color: Colors.PURPLE },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  infoLabel: { fontSize: 16, color: Colors.DARK_GRAY, fontWeight: "500" },
  infoValue: { fontSize: 16, color: Colors.LIGHT_GRAY, flexShrink: 1, maxWidth: "60%", textAlign: "right" },
  interestsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  interestTag: { backgroundColor: Colors.LIGHT_PURPLE, borderRadius: 15, paddingVertical: 8, paddingHorizontal: 15 },
  interestText: { color: "white", fontSize: 14 },
});

export default GroupInfo;