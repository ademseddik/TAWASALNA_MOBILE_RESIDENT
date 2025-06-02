

import { View, Text, Image, ActivityIndicator, TouchableOpacity,Modal  } from "react-native";
import React, { useState, useEffect } from "react";
import Colors from "../../assets/Colors";
import { EvilIcons, Feather, Entypo } from "@expo/vector-icons";
import CommentModel from "../components/pupUps/CommentModel";
import SendModel from "../components/pupUps/SendModel";
import ShareModel from "../components/pupUps/ShareModel";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { encode } from "base64-arraybuffer";
import PostOptionsModel from "../components/pupUps/PostOptionsModel";
import Axios from 'axios';
import { APP_ENV } from '../utils/BaseUrl';
import { ScrollView } from "react-native-gesture-handler";



const ProfilePosts = ({ fullName, profilePic, idfromUsersprofile }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isCommentModalVisible, setCommentModalVisible] = useState(false);
  const [isSendModalVisible, setSendModalVisible] = useState(false);
  const [isShareModalVisible, setShareModalVisible] = useState(false);
  const [isOptionsPostModalVisible, setOptionsPostModalVisible] =
    useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPostCommentId, setSelectedPostCommentId] = useState(null);
  const [data, setData] = useState([]);
  const [imageUris, setImageUris] = useState([]);
  const [fetched, setFetched] = useState(false);
  const [isFetchingPosts, setIsFetchingPosts] = useState(false);
  const [isFetchingImages, setIsFetchingImages] = useState(false);
  const [scrollViewImages, setScrollViewImages] = useState([]);
  const [userId, setUserId] = useState(null); 

useEffect(() => {
  console.log("4")
   const fetchUserId = async () => {
    const storedUserId = await AsyncStorage.getItem("userId");
    setUserId(storedUserId); 
  };
  fetchUserId();
}, []);
  ///////////////////////////////////////////////////////////
  const toggleOptionsPostModal = (postId) => {
    setSelectedPostId(postId);
    setOptionsPostModalVisible(!isOptionsPostModalVisible);
  };

 const toggleCommentModal = (postCommentId) => {
   setSelectedPostCommentId(postCommentId);
   setCommentModalVisible(!isCommentModalVisible);
 };

  const toggleSendModal = () => {
    setSendModalVisible(!isSendModalVisible);
  };
  const toggleShareModal = () => {
    setShareModalVisible(!isShareModalVisible);
  };
  const handleImagePress = (image) => {
    setScrollViewImages(images);
    setModalVisible(true);
  };
  /////////////////////////////////////////////////////////////////////////
  const fetchProfilePosts = async () => {
    console.log("1")
    setIsFetchingPosts(true);
    try {
      let userId = await AsyncStorage.getItem("userId");
      console.log("3")
      if (idfromUsersprofile) {
        userId = idfromUsersprofile;
        console.log("4")
      }
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentpostsWithPhotos/${userId}`
      );

      if (
        response.data &&
        response.data !== "No posts with photos found for user"
      ) {
        const residentPosts = response.data;
        console.log("resident Post Response : ", response.data);
        if (residentPosts.length > 0) {
          residentPosts.sort((a, b) => {
            const dateA = new Date(a.postDateTime);
            const dateB = new Date(b.postDateTime);
            return dateB - dateA;
          });
          console.log("5")
          setData(residentPosts);
        }
        setFetched(true);
      } else {
        console.log("No resident posts found.");
      }
    } catch (error) {
      console.error("Error getting resident posts:", error);
    } finally {
      setIsFetchingPosts(false);
    }
  };

  useEffect(() => {
    if (!fetched) {
      fetchProfilePosts();
    }
  }, [fetched]);
  ///////////////////////////////////////////////////////////////////////////
  const fetchImage = async (data) => {
setIsFetchingImages(true);
try {
const filteredData = data.filter((post) => !post.video);
const newImageUris = {};

   for (const post of filteredData) {
     const photoPromises = post.photos.map(async (photoId) => {
       try {
         const response = await Axios.get(
           `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/images?fileUrl=${encodeURIComponent(
             photoId
           )}`,
           {
             responseType: "arraybuffer",
           }
         );
         const base64Image = encode(response.data);
         return `data:image/jpeg;base64,${base64Image}`;
       } catch (error) {
         console.error(
           `Error fetching image ${photoId} for post ${post.id}:`,
           error
         );
         return null;
       }
     });

     const photoResults = await Promise.all(photoPromises);
     newImageUris[post.id] = photoResults.filter((image) => image !== null);
   }

   setImageUris(newImageUris);
   console.log(
     "Fetched images for posts:",
     Object.keys(newImageUris).length
   );
 } catch (error) {
   console.error("Error fetching images:", error);
 } finally {
   setIsFetchingImages(false);
 }
};
useEffect(() => {
if (data.length > 0) {
fetchImage(data);
}
}, [data]);
  ///////////////////////////////////////////////////////////////////////////
  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
  }
  //////////////////////////////////////////////////////////////////////////
  return (
    <ScrollView>
      {isFetchingPosts ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            marginTop: "30%",
          }}
        >
          <ActivityIndicator size="large" color={Colors.PURPLE} />
        </View>
      ) : (
        <>
          {data.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: "50%" }}>
              <Text>No posts yet</Text>
            </View>
          ) : (
            data.map((post, index) => (
              <View
                key={post.id}
                style={{
                  borderRadius: 10,
                  marginLeft: "2%",
                  marginRight: "2%",
                  marginVertical: 6,
                  paddingVertical: 10,
                }}
              >
                <View style={{ flexDirection: "row", marginLeft: 10 }}>
                  {profilePic !== "data:image/jpeg;base64," ? (
                    <Image
                      source={{ uri: profilePic }}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        borderWidth: 1,
                      }}
                    />
                  ) : (
                    <Image
                      source={require("../../assets/default-avatar.jpg")}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        borderWidth: 1,
                      }}
                    />
                  )}
                  <Text
                    style={{
                      color: "black",
                      fontSize: 16,
                      marginTop: 3,
                      marginLeft: 7,
                      fontWeight: 500,
                    }}
                  >
                    {fullName}
                  </Text>
                  <TouchableOpacity
                    style={{ marginLeft: "30%" }}
                    onPressIn={() => toggleOptionsPostModal(post.id)}
                  >
                    <Feather name="more-horizontal" size={25} />
                  </TouchableOpacity>
                </View>
                <Text
                  style={{
                    color: "grey",
                    fontSize: 13,
                    marginTop: "-7%",
                    marginLeft: "19%",
                  }}
                >
                  {formatDateTime(post.postDateTime)}
                </Text>
                <View style={{ marginLeft: "6%", marginTop: "5%" }}>
                  <Text>{post.caption}</Text>
                </View>
                {isFetchingImages ? (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      marginTop: "10%",
                    }}
                  >
                    <ActivityIndicator size="large" color={Colors.PURPLE} />
                  </View>
                ) : (
                  <TouchableOpacity style={{ alignItems: "center" }}>
                    {post.photos && post.photos.length > 0 ? (
                      <>
                        {post.photos.length === 1 ? (
                          <Image
                            source={{
                              uri: imageUris[post.id] && imageUris[post.id][0],
                            }}
                            style={{
                              width: "95%",
                              height: 200,
                              borderRadius: 10,
                              marginTop: 10,
                            }}
                            resizeMode="cover"
                          />
                        ) : post.photos.length <= 4 ? (
                          chunkArray(post.photos, 2).map(
                            (photoRow, rowIndex) => (
                              <View
                                key={rowIndex}
                                style={{
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                  width: "90%",
                                  marginTop: 10,
                                }}
                              >
                                {photoRow.map((photo, photoIndex) => (
                                  <Image
                                    key={photoIndex}
                                    source={{
                                      uri:
                                        imageUris[post.id] &&
                                        imageUris[post.id][
                                          rowIndex * 2 + photoIndex
                                        ],
                                    }}
                                    style={{
                                      width: "48%",
                                      height: 200,
                                      borderRadius: 10,
                                    }}
                                    resizeMode="cover"
                                  />
                                ))}
                              </View>
                            )
                          )
                        ) : (
                          <>
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                width: "90%",
                                marginTop: 10,
                              }}
                            >
                              {post.photos.slice(0, 2).map((photo, index) => (
                                <Image
                                  key={index}
                                  source={{
                                    uri:
                                      imageUris[post.id] &&
                                      imageUris[post.id][index],
                                  }}
                                  style={{
                                    width: "48%",
                                    height: 200,
                                    borderRadius: 10,
                                  }}
                                  resizeMode="cover"
                                />
                              ))}
                            </View>
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                width: "90%",
                                marginTop: 10,
                              }}
                            >
                              <FastImage
                                source={{
                                  uri:
                                    imageUris[post.id] && imageUris[post.id][2],
                                }}
                                style={{
                                  width: "48%",
                                  height: 200,
                                  borderRadius: 10,
                                }}
                                resizeMode="cover"
                              />
                              <TouchableOpacity onPress={handleImagePress}>
                                <View
                                  style={{
                                    width: 150,
                                    height: 200,
                                    borderRadius: 10,
                                    backgroundColor: "black",
                                    justifyContent: "center",
                                    alignItems: "center",
                                  }}
                                >
                                  <Text
                                    style={{ color: "white", fontSize: 18 }}
                                  >
                                    +{post.photos.length - 3}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            </View>
                          </>
                        )}
                      </>
                    ) : null}
                  </TouchableOpacity>
                )}
                <View style={{ flexDirection: "row" }}>
                  <Text
                    style={{
                      color: Colors.BLACK,
                      marginLeft: 20,
                      marginTop: 8,
                    }}
                  >
                    {post.likedBy.length}{" "}
                    {post.likedBy.length === 1 ? "like" : "likes"}
                  </Text>
                  <Text
                    style={{
                      color: Colors.BLACK,
                      marginLeft: 20,
                      marginTop: 8,
                    }}
                  >
                    {post.comments.length}{" "}
                    {post.comments.length === 1 ? "comment" : "comments"}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: Colors.GunmetalGray,
                    alignItems: "center",
                    width: "95%",
                    height: 1,
                    marginTop: 10,
                    marginLeft: "3%",
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 40,
                    marginTop: 5,
                    paddingTop: 5,
                  }}
                >
                  <TouchableOpacity
                    style={{
                      alignItems: "center",
                      flexDirection: "row",
                      marginRight: "5%",
                      marginLeft: "-11%",
                    }}
                    onPress={() => toggleLike(post.id)}
                  >
                    <EvilIcons
                      name={"like"}
                      size={30}
                      color={
                        post.likedBy.includes(userId) ? Colors.LIGHT_PURPLE : Colors.BLACK
                      }
                      
                      style={{ marginRight: -2 }}
                    />
                   
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      alignItems: "center",
                      flexDirection: "row",
                      marginLeft: "-30%",
                    }}
                    onPressIn={() => toggleCommentModal(post.id)}
                  >
                    <EvilIcons name="comment" size={30} color={Colors.LIGHT_PURPLE} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      alignItems: "center",
                      flexDirection: "row",
                      left: "-25%",
                    }}
                    Entypo
                    onPress={toggleSendModal}
                  >
                    <Feather
                      name="send"
                      size={22}
                      color={Colors.LIGHT_PURPLE}
                      style={{ marginRight: 5 }}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      alignItems: "center",
                      flexDirection: "row",
                      left: "9%",
                    }}
                    onPress={toggleShareModal}
                  >
                    <Entypo
                      name="share"
                      size={22}
                      color={Colors.LIGHT_PURPLE}
                      style={{ marginRight: 5 }}
                    />
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    backgroundColor: Colors.GunmetalGray,
                    alignItems: "center",
                    width: "95%",
                    height: 1,
                    marginTop: 10,
                    marginLeft: "3%",
                  }}
                />
              </View>
            ))
          )}
        </>
      )}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          }}
        >
          <TouchableOpacity
            style={{ position: "absolute", top: 20, right: 20 }}
            onPress={() => setModalVisible(false)}
          >
            <Text style={{ color: "white", fontSize: 18 }}>Close</Text>
          </TouchableOpacity>
          <Image
            source={selectedImage}
            style={{ width: "90%", height: "90%", resizeMode: "contain" }}
          />
        </View>
      </Modal>
      <CommentModel
        isVisible={isCommentModalVisible}
        onClose={toggleCommentModal}
        postId={selectedPostCommentId}
        fullName={fullName}
        refreshPosts={fetchProfilePosts}
      />
      <SendModel isVisible={isSendModalVisible} onClose={toggleSendModal} />
      <ShareModel isVisible={isShareModalVisible} onClose={toggleShareModal} />
      <PostOptionsModel
        isVisible={isOptionsPostModalVisible}
        onClose={toggleOptionsPostModal}
        postId={selectedPostId}
        refreshPosts={fetchProfilePosts}
        //refreshImages={fetchImage}
      />
    </ScrollView>
  );


};

export default ProfilePosts
