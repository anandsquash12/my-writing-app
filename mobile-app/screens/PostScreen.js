import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { onValue, push, ref, runTransaction, set } from "firebase/database";
import { db } from "../firebase";

function normalizeComment(id, value) {
  const source = value || {};

  return {
    id,
    text: typeof source.text === "string" ? source.text : "",
    userName: typeof source.userName === "string" ? source.userName : "User",
    createdAt: typeof source.createdAt === "number" ? source.createdAt : 0,
  };
}

export default function PostScreen({ post, onBack, user }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [savingComment, setSavingComment] = useState(false);
  const [savingLike, setSavingLike] = useState(false);

  useEffect(() => {
    const commentsUnsubscribe = onValue(ref(db, `comments/${post.id}`), (snapshot) => {
      const data = snapshot.val() || {};
      const nextComments = Object.entries(data)
        .map(([id, value]) => normalizeComment(id, value))
        .filter((comment) => comment.text.trim().length > 0)
        .sort((a, b) => a.createdAt - b.createdAt);

      setComments(nextComments);
    });

    const likesUnsubscribe = onValue(ref(db, `likes/${post.id}`), (snapshot) => {
      const data = snapshot.val() || {};
      setLikeCount(Object.keys(data).length);
      setLiked(Boolean(user?.uid) && data[user.uid] === true);
    });

    return () => {
      commentsUnsubscribe();
      likesUnsubscribe();
    };
  }, [post.id, user?.uid]);

  const handleToggleLike = async () => {
    if (!user?.uid || savingLike) {
      return;
    }

    try {
      setSavingLike(true);
      await set(ref(db, `likes/${post.id}/${user.uid}`), liked ? null : true);
      await runTransaction(ref(db, `posts/${post.id}/likeCount`), (current) => {
        const safeCurrent = typeof current === "number" ? current : 0;
        return liked ? Math.max(0, safeCurrent - 1) : safeCurrent + 1;
      });
    } finally {
      setSavingLike(false);
    }
  };

  const handleAddComment = async () => {
    if (!user?.uid || !commentText.trim() || savingComment) {
      return;
    }

    try {
      setSavingComment(true);
      const newCommentRef = push(ref(db, `comments/${post.id}`));
      await set(newCommentRef, {
        text: commentText.trim(),
        userId: user.uid,
        userName: user.displayName || user.email || "User",
        createdAt: Date.now(),
      });
      setCommentText("");
    } finally {
      setSavingComment(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.card}>
            {post.imageURL?.trim() ? <Image source={{ uri: post.imageURL.trim() }} style={styles.image} /> : null}
            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.meta}>{post.authorName}</Text>
            <Text style={styles.content}>{post.content}</Text>

            <View style={styles.actionsRow}>
              <Pressable onPress={handleToggleLike} disabled={savingLike} style={[styles.actionButton, savingLike && styles.actionButtonDisabled]}>
                {savingLike ? <ActivityIndicator color="#1f1a17" /> : <Text style={styles.actionText}>{liked ? `Unlike (${likeCount})` : `Like (${likeCount})`}</Text>}
              </Pressable>
            </View>

            <View style={styles.commentComposer}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Write a comment"
                style={styles.commentInput}
              />
              <Pressable onPress={handleAddComment} disabled={savingComment} style={[styles.sendButton, savingComment && styles.actionButtonDisabled]}>
                {savingComment ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.sendText}>Comment</Text>}
              </Pressable>
            </View>

            <Text style={styles.commentsHeader}>Comments</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.commentCard}>
            <Text style={styles.commentAuthor}>{item.userName}</Text>
            <Text style={styles.commentText}>{item.text}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No comments yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8f3d2c",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 24,
    backgroundColor: "#ffffff",
    padding: 16,
    marginBottom: 16,
  },
  image: {
    width: "100%",
    height: 240,
    borderRadius: 18,
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f1a17",
  },
  meta: {
    marginTop: 6,
    color: "#6c625b",
  },
  content: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 23,
    color: "#372f2a",
  },
  actionsRow: {
    marginTop: 18,
    flexDirection: "row",
  },
  actionButton: {
    borderRadius: 14,
    backgroundColor: "#efe6dc",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionText: {
    color: "#1f1a17",
    fontWeight: "700",
  },
  commentComposer: {
    marginTop: 16,
    flexDirection: "row",
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ded6cc",
    borderRadius: 16,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sendButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#1f1a17",
    paddingHorizontal: 16,
  },
  sendText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  commentsHeader: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "700",
    color: "#1f1a17",
  },
  commentCard: {
    borderRadius: 18,
    backgroundColor: "#ffffff",
    padding: 14,
    marginBottom: 10,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8f3d2c",
  },
  commentText: {
    marginTop: 6,
    fontSize: 14,
    color: "#372f2a",
  },
  emptyText: {
    textAlign: "center",
    color: "#6c625b",
  },
});
