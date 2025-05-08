import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import Axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { APP_ENV } from "../../../src/utils/BaseUrl";
import InfoRoute from './InfoGroup';
import GroupMembers from "./GroupMembers";
import PostsRoute from './PostGroup';

const initialLayout = { width: Dimensions.get("window").width };

const ShowGroup = ({ route }) => {
    const { userId } = route.params; // Get selected user's ID
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: "posts", title: "Posts" },
        { key: "GroupMembers", title: "Members" },
        { key: "info", title: "Info" },
    ]);

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch Profile Data
    const fetchGroupData = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const response = await Axios.get(
                `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/getGroupById${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setProfileData(response.data);
        } catch (error) {
            console.error("Error fetching profile data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroupData();
    }, [userId]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200EE" />
            </View>
        );
    }

    const renderScene = SceneMap({
        posts: () => <PostsRoute userId={userId} />, // Pass user ID
        GroupMembers: () => <GroupMembers userId={userId} />,
        info: () => <InfoRoute userId={userId} />,
    });

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.profileHeaderWrapper}>
                <Image source={{ uri: profileData?.coverphoto || "https://placeholder.com/avatar" }} style={styles.coverImage} />
                <Image source={{ uri: profileData?.profilephoto || "https://placeholder.com/avatar" }} style={styles.avatar} />
                <View style={styles.profileInfo}>
                    <Text style={styles.name}>{profileData?.fullName || "Unknown User"}</Text>
                    <Text style={styles.bio}>{profileData?.bio || "No bio available."}</Text>
                </View>
            </View>

            <View style={{ flex: 1, height: Dimensions.get('window').height * 0.6 }}>

                <TabView
                    style={{ flex: 1, borderRadius: 30 }}
                    navigationState={{ index, routes }}
                    renderScene={renderScene}
                    onIndexChange={setIndex}
                    initialLayout={initialLayout}
                    overScrollMode={"always"}
                    renderTabBar={props => (
                        <TabBar
                            {...props}
                            indicatorStyle={{ backgroundColor: "white", height: 3 }}
                            style={{ backgroundColor: Colors.LIGHT_PURPLE, elevation: 30 }}

                            renderLabel={({ route }) => (
                                <Text style={{
                                    color: 'black',
                                    fontWeight: 'bold',
                                    textShadowColor: 'black',
                                    textShadowOffset: { width: 0, height: 0 },
                                    textShadowRadius: 0,
                                }}>
                                    {route.title}
                                </Text>
                            )}
                        />
                    )}
                />
            </View>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 10 },
    profileHeaderWrapper: { alignItems: "center", marginBottom: 20 },
    coverImage: { width: "100%", height: 180, borderRadius: 30 },
    avatar: { width: 100, height: 100, borderRadius: 50, marginTop: -50, borderWidth: 3, borderColor: "#6200EE" },
    name: { fontSize: 24, fontWeight: "bold", marginTop: 10 },
    bio: { fontSize: 16, color: "#666", marginTop: 5 },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default ShowGroup;