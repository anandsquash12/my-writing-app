import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { onValue, ref } from "firebase/database";
import { db } from "../firebase";

function normalizePost(id, value) {
  const source = value || {};

  return {
    id,
    title: typeof source.title === "string" ? source.title : "Untitled",
    content: typeof source.content === "string" ? source.content : "",
    authorName: typeof source.authorName === "string" ? source.authorName : "Unknown writer",
    imageURL: typeof source.imageURL === "string" ? source.imageURL : "",
    createdAt: typeof source.createdAt === "number" ? source.createdAt : 0,
    likeCount: typeof source.likeCount === "number" ? source.likeCount : 0,
    visibility: source.visibility === "private" ? "private" : "public",
    status: source.status === "draft" ? "draft" : "published",
  };
}

export default function FeedScreen({ onOpenPost }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onValue(ref(db, "posts"), (snapshot) => {
      const data = snapshot.val() || {};
      const nextPosts = Object.entries(data)
        .map(([id, value]) => normalizePost(id, value))
        .filter((post) => post.visibility === "public" && post.status === "published")
        .sort((a, b) => b.createdAt - a.createdAt);

      setPosts(nextPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const emptyView = useMemo(() => {
    if (loading) {
      return <ActivityIndicator size="large" color="#1f1a17" style={{ marginTop: 48 }} />;
    }

    return <Text style={styles.emptyText}>No posts yet.</Text>;
  }, [loading]);

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={emptyView}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => onOpenPost(item)}>
          {item.imageURL.trim() ? <Image source={{ uri: item.imageURL.trim() }} style={styles.image} /> : null}
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>
            {item.authorName} · {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.body} numberOfLines={3}>
            {item.content}
          </Text>
          <Text style={styles.likes}>{item.likeCount} likes</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 24,
    backgroundColor: "#ffffff",
    padding: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 18,
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f1a17",
  },
  meta: {
    marginTop: 6,
    fontSize: 13,
    color: "#6c625b",
  },
  body: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: "#372f2a",
  },
  likes: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "600",
    color: "#8f3d2c",
  },
  emptyText: {
    marginTop: 48,
    textAlign: "center",
    color: "#6c625b",
  },
});
