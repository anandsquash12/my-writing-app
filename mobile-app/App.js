import React, { useEffect, useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import LoginScreen from "./screens/LoginScreen";
import FeedScreen from "./screens/FeedScreen";
import PostScreen from "./screens/PostScreen";

export default function App() {
  const [user, setUser] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
    });

    return unsubscribe;
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {!user ? (
          <LoginScreen />
        ) : selectedPost ? (
          <PostScreen post={selectedPost} onBack={() => setSelectedPost(null)} user={user} />
        ) : (
          <FeedScreen onOpenPost={setSelectedPost} user={user} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f5f2",
  },
  container: {
    flex: 1,
  },
});
