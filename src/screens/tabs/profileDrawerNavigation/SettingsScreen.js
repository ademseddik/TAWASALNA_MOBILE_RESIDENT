import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ProfileService } from '../../../services/profile.service';  // Import the Updateprivacy function

const SettingsScreen = ({ navigation }) => {
    const [isPublic, setIsPublic] = useState(true);

    // Load privacy setting from AsyncStorage
    useEffect(() => {
        const loadPrivacySetting = async () => {
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
        <View style={styles.container}>
            {/* Change Password Section */}
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

            {/* Change Email Section */}
            <TouchableOpacity
                style={styles.section}
                onPress={() => navigation.navigate('ChangeEmail')}
            >
                <View style={styles.sectionContent}>
                    <Ionicons name="mail" size={24} color="#333" />
                    <Text style={styles.sectionTitle}>Change Email Address</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
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
