import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { EvilIcons, Feather, Entypo } from 'react-native-vector-icons';
import Colors from '../../assets/Colors';
import LottieView from 'lottie-react-native';

const GroupPosts = ({
  postsData,
  isLoading,
  isFetchingImages,
  imageUris,
  profilePics,
  userIdHome,
  onLike,
  onComment,
  onSend,
  onShare,
  onOptions,
  formatDateTime,
  chunkArray,
}) => {
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          marginTop: "30%",
          marginBottom: "30%",
        }}
      >
        <LottieView
          source={require('../../assets/animations/LoadingPublications.json')}
          autoPlay
          loop
          style={{
            width: 400,
            height: 370,
          }}
        />
      </View>
    );
  }

  if (postsData.length === 0) {
    return (
      <View style={{ alignItems: "center", marginTop: "50%" }}>
        <Text>No post in this group yet</Text>
      </View>
    );
  }

  return (
    <>
      {postsData.map((post, index) => (
        <Card
          key={post.id}
          style={{
            width: "100%",
            marginTop: "5%",
            borderRadius: 0,
            backgroundColor: "white",
          }}
        >
          <Card.Content>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {profilePics[index] !== "data:image/jpeg;base64," ? (
                <Image
                  source={{ uri: profilePics[index] }}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    borderWidth: 1,
                    borderColor: "black",
                  }}
                />
              ) : (
                <Image
                  source={require("../../assets/photoprofil.png")}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    borderWidth: 1,
                    borderColor: "black",
                  }}
                />
              )}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Title style={{ fontSize: 15, fontWeight: 500 }}>
                  {post.user?.residentProfile?.fullName || "No Username Provided"}
                </Title>
                <Text
                  style={{ marginTop: -7, color: "grey", fontSize: 13 }}
                >
                  {formatDateTime(post.postDateTime)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => onOptions(post.id)}
                style={{ marginTop: -10 }}
              >
                <Feather name="more-horizontal" size={25} />
              </TouchableOpacity>
            </View>
            {post.caption && (
              <Paragraph
                style={{
                  marginTop: 10,
                  color: "black",
                  fontSize: 14,
                  marginBottom: 5,
                }}
              >
                {post.caption}
              </Paragraph>
            )}
          </Card.Content>

          {post.photos && post.photos.length > 0 && (
            isFetchingImages ? (
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
              <Card.Content>
                {post.photos.length === 1 ? (
                  <View style={{ alignItems: "center" }}>
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
                  </View>
                ) : post.photos.length <= 4 ? (
                  chunkArray(post.photos, 2).map((photoRow, rowIndex) => (
                    <View
                      key={rowIndex}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                      }}
                    >
                      {photoRow.map((photo, photoIndex) => (
                        <Image
                          key={photoIndex}
                          source={{
                            uri:
                              imageUris[post.id] &&
                              imageUris[post.id][rowIndex * 2 + photoIndex],
                          }}
                          style={{
                            width: "48%",
                            height: 200,
                            borderRadius: 10,
                            margin: "1%",
                          }}
                          resizeMode="cover"
                        />
                      ))}
                    </View>
                  ))
                ) : (
                  <>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
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
                            margin: "1%",
                          }}
                          resizeMode="cover"
                        />
                      ))}
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                      }}
                    >
                      <Image
                        source={{
                          uri: imageUris[post.id] && imageUris[post.id][2],
                        }}
                        style={{
                          width: "48%",
                          height: 200,
                          borderRadius: 10,
                          margin: "1%",
                        }}
                        resizeMode="cover"
                      />
                      <View
                        style={{
                          width: "48%",
                          height: 200,
                          borderRadius: 10,
                          margin: "1%",
                          backgroundColor: "black",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: "white", fontSize: 18 }}>
                          +{post.photos.length - 3}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </Card.Content>
            )
          )}
          <View style={{ flexDirection: "row" }}>
            <Text
              style={{ color: Colors.BLACK, marginLeft: 20, marginTop: 8 }}
            >
              {post.likedBy.length} {""}
              {post.likedBy.length === 1 ? "like" : "likes"}
            </Text>
            <Text
              style={{ color: Colors.BLACK, marginLeft: 20, marginTop: 8 }}
            >
              {post.comments.length} {""}
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
          <Card.Actions style={{ justifyContent: "space-between" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginRight: 160,
              }}
            >
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginHorizontal: 10,
                }}
                onPress={() => onLike(post.id)}
              >
                <EvilIcons
                  name={"like"}
                  size={30}
                  color={
                    post.likedBy.includes(userIdHome)
                      ? Colors.LIGHT_PURPLE
                      : Colors.BLACK
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginHorizontal: 10,
                }}
                onPress={() => onComment(post.id)}
              >
                <EvilIcons name="comment" size={30} color={Colors.BLACK} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginHorizontal: 10,
                }}
                onPress={onSend}
              >
                <Feather
                  name="send"
                  size={22}
                  color={Colors.LIGHT_PURPLE}
                />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginHorizontal: 10,
                }}
                onPress={onShare}
              >
                <Entypo name="share" size={22} color={Colors.BLACK} />
              </TouchableOpacity>
            </View>
          </Card.Actions>
        </Card>
      ))}
    </>
  );
};

export default GroupPosts; 