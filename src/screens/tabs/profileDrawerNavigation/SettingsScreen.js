import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ProfileService } from '../../../services/profile.service';  // Import the Updateprivacy function
import Colors from '../../../../assets/Colors';

const SettingsScreen = ({ navigation }) => {
    const [isPublic, setIsPublic] = useState(true);
  const [isSocialAuth, setIsSocialAuth] = useState(false);

    // Load privacy setting from AsyncStorage
    useEffect(() => {
        const loadPrivacySetting = async () => {
             const socialAuth = await AsyncStorage.getItem("SOCIAL_AUTH");
    setIsSocialAuth(socialAuth === 'true'); // Add this line
            try {
                const privacyValue = await AsyncStorage.getItem('PRIVACY');
                if (privacyValue !== null) {
                    setIsPublic(privacyValue === 'PUBLIC'); // assuming 'public' or 'private' is stored
                }
            } catch (e) {
                console.log('Failed to load privacy setting', e);
            }
        };
        loadPrivacySetting();
    }, []);

    // Handle toggle switch
    const handleToggle = async () => {
        console.log("im here")
        const newIsPublic = !isPublic;
        setIsPublic(newIsPublic);

        try {
            // Get userId and token from AsyncStorage
            const userId = await AsyncStorage.getItem('userId');
            const token = await AsyncStorage.getItem('USER_ACCESS');  // Assuming you have a token stored
            console.log("im here")
            if (userId && token) {
                const credentials = {
                    userId,
                    token,
                    privacy: newIsPublic ? 'PUBLIC' : 'PRIVATE',
                };

                // Call the Updateprivacy function to update the backend
                await ProfileService.Updateprivacy(credentials);
                console.log(Updateprivacy)
                // Optionally, store the new privacy setting in AsyncStorage
                await AsyncStorage.setItem('PRIVACY', newIsPublic ? 'PUBLIC' : 'PRIVATE');

                console.log('Privacy setting updated successfully');
            } else {
                console.log('User not authenticated');
            }
        } catch (e) {
            console.log('Failed to update privacy setting', e);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            {/* Header with back arrow */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color={Colors.LIGHT_PURPLE} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>profile</Text>
                <View style={styles.placeholder} />
            </View>
            
            <View style={styles.container}>
               {!isSocialAuth && (
            <TouchableOpacity
                style={styles.section}
                onPress={() => navigation.navigate('change password')}
            >
                <View style={styles.sectionContent}>
                    <Ionicons name="lock-closed" size={24} color="#333" />
                    <Text style={styles.sectionTitle}>Change Password</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>
               )}

            {/* Account Privacy Section */}
            <View style={styles.section}>
                <View style={styles.sectionContent}>
                    <Ionicons name="people" size={24} color="#333" />
                    <View style={styles.textContainer}>
                        <Text style={styles.sectionTitle}>Private Account</Text>
                        <Text style={styles.description}>
                            {isPublic
                                ? 'Your profile and posts are visible to everyone'
                                : 'Only approved followers can see your posts'}
                        </Text>
                    </View>
                </View>
                <Switch
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={isPublic ? "#f5dd4b" : "#f4f3f4"}
                    onValueChange={handleToggle}
                    value={!isPublic}
                />
            </View>

        </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: Colors.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        flex: 1,
        textAlign: 'center',
    },
    placeholder: {
        width: 44,
        height: 44,
        marginLeft: 16,
    },
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    section: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
    },
    sectionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textContainer: {
        marginLeft: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#666',
        maxWidth: 250,
    },
});

export default SettingsScreen;
