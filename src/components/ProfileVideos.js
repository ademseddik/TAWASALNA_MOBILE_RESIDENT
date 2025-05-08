import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import React , {useEffect, useState} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { encode } from "base64-js";
// import { useVideoPlayer, VideoView } from  "expo-video"


import Axios from "axios";
import { APP_ENV } from "../utils/BaseUrl";


const ProfileVideos = () => {
  const [data, setData] = useState([]);
  const [videoUri, setVideoUri] = useState([]);
  const [loading, setLoading] = useState(true);

  /////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const fetchProfilePosts = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        const response = await Axios.get(
          `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentpostsWithVideos/${userId}`
        );

        if (response.data && response.data !== "No posts found for user") {
          const residentPosts = response.data;
            console.log("resident video", residentPosts);
      
            setData(residentPosts);
      
        } else {
          console.log("No resident posts found.");
        }
      } catch (error) {
        console.error("Error getting resident posts:", error);
      }
    };

    fetchProfilePosts();
  }, []);

  //////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const filteredData = data.filter((post) => !post.photo);

        const videos = await Promise.all(
          filteredData.map(async (post) => {
            console.log("Videos name:", post.video);

            const response = await Axios.get(
              `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/videos/${post.video}`,
              {
                responseType: "blob",
              }
            );
            
            const blobData = response.data;
            const videoBlob = new Blob([blobData], { type: "video/mp4" }); 
            return videoBlob;
          
          })
        );

        setVideoUri(videos); 
        setLoading(false);
      } catch (error) {
        console.error("Error fetching videos:", error);
      }
    };

    fetchVideo();
  }, []);
  ///////////////////////////////////////////////////////////////////////////

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {videoUri.map((videoUrl, index) => (
        <View key={index} style={styles.videoContainer}>
          {/* <Video
            source={{ uri: videoUrl[index] }}
            style={{
              width: 300,
              height: 200,
              borderWidth: 2,
              borderRadius: 20,
            }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
          /> */}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  videoContainer: {
    marginVertical: 10, 
    alignItems: "center",
  },
  video: {
    width: Dimensions.get("window").width - 40, 
    height: 200,
    borderRadius: 20,
  },
});

export default ProfileVideos;
