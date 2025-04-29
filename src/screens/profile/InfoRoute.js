import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "../../../assets/Colors";
import Axios from "axios";
import { APP_ENV } from "../../../src/utils/BaseUrl";
import { useTranslation } from "react-i18next";
import { ScrollView } from 'react-native-gesture-handler';



function InfoRoute() {
    const { t } = useTranslation();

    const [profileData, setProfileData] = useState(null);

    const [loading, setLoading] = useState(true);
    const [isCompleteInformationsModalVisible, setCompleteInformationsModalVisible] = useState(false);
    const fetchProfileData = async () => {

        try {
            const userId = await AsyncStorage.getItem("userId");
            const token = await AsyncStorage.getItem("token");

            const response = await Axios.get(
                `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${userId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const userinformations = await Axios.get(
                `${APP_ENV.AUTH_PORT}/tawasalna-user/user/${userId}`);

            const residentData = response.data;
            const userCommunity = userinformations.data?.community?.name || null;

            // Merge the two
            const mergedData = {
                ...residentData,
                community: userCommunity
            };


            setProfileData(mergedData);



            if (!response.data.dateOfBirth)
                setCompleteInformationsModalVisible(!isCompleteInformationsModalVisible);
        } catch (error) {
            console.error("Error fetching profile data:", error);
        }
    };



    useEffect(() => {
        const loadData = async () => {
            await fetchProfileData();


            setLoading(false);
        };

        loadData();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.PURPLE} />
            </View>
        );
    }


    return (
        <ScrollView
          
            contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.scene}>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t("Personal Information")}</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t("Age")}:</Text>
                        <Text style={styles.infoValue}>{profileData?.age || "-"}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t("Gender")}:</Text>
                        <Text style={styles.infoValue}>
                            {profileData?.gender ? t(profileData.gender) : "-"}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t("Date of Birth")}:</Text>
                        <Text style={styles.infoValue}>
                            {profileData?.dateOfBirth ?
                                new Date(profileData.dateOfBirth).toLocaleDateString()
                                : "-"}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t("Address")}:</Text>
                        <Text style={styles.infoValue}>
                            {profileData?.address || t("No address provided")}
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t("Interests")}</Text>
                    <View style={styles.interestsContainer}>
                        {profileData?.interests?.map((interest, index) => (
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
                        <Text style={styles.infoValue}>{profileData?.community || "-"}</Text>
                    </View>
                </View>


            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scene: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop:20
      },
      scrollContent: {
        paddingBottom: 30,
        paddingHorizontal: 10,
      },
    section: {
        marginHorizontal: 10,
        marginBottom: 25,
        width: '100%', // Use full width with horizontal margins
        backgroundColor: Colors.LIGHT_WHITE,
        borderRadius: 10,
        padding: 15,
    },
    container: {
        backgroundColor: "white",
        marginTop: 20
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },


    coverImage: {
        width: "100%",
        height: 180,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },

    avatarContainer: {
        position: "relative",
        marginBottom: 20,
        marginTop: -10
    },
    avatar: {
        position: "relative",
        width: 120,
        height: 120,
        borderRadius: 60,
        marginTop: -70,
        borderWidth: 3,
        borderColor: Colors.LIGHT_PURPLE,
    },
    editButton: {
        position: "absolute",
        bottom: -2,
        right: 4,
        backgroundColor: Colors.LIGHT_PURPLE,
        padding: 8,
        borderRadius: 20,
        elevation: 3,
    },
    editButtonText: {
        color: "white",
        fontWeight: "bold",
    },
    profileInfo: {
        alignItems: "center",
    },
    name: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 5,
    },
    residentId: {
        fontSize: 16,
        color: Colors.GRAY,
    },
    bio: {
        fontSize: 16,
        color: Colors.GRAY,
        maxWidth: 300,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15,
        color: Colors.PURPLE,
    },
    sectionContent: {
        fontSize: 16,
        lineHeight: 24,
        color: Colors.DARK_GRAY,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    infoLabel: {
        fontSize: 16,
        color: Colors.DARK_GRAY,
        fontWeight: "500",
    },
    infoValue: {
        fontSize: 16,
        color: Colors.LIGHT_GRAY,
        flexShrink: 1,
        maxWidth: "60%",
        textAlign: "right",
    },
    interestsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    interestTag: {
        backgroundColor: Colors.LIGHT_PURPLE,
        borderRadius: 15,
        paddingVertical: 8,
        paddingHorizontal: 15,
    },
    interestText: {
        color: "white",
        fontSize: 14,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.RED,
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
    },
    signOutText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 10,
    },
});

export default InfoRoute;
