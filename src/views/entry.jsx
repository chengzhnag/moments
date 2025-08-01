import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button, Avatar, Image,
  ImageViewer, DotLoading,
  SafeArea, PullToRefresh,
  Skeleton, ActionSheet,
  Toast
} from "antd-mobile";
import { useMount } from "ahooks";
import { useAuth } from "../utils/authContext";
import {
  HeartOutline,
  MessageOutline,
  // ShareOutline,
  MoreOutline,
  LocationOutline,
  // TimeOutline
} from 'antd-mobile-icons';
import styles from './entry.module.css';

const Entry = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [posts, setPosts] = useState([
    {
      id: 1,
      user: {
        name: "大梦一场的张先生",
        avatar: "https://via.placeholder.com/40x40/4A90E2/FFFFFF?text=张",
        verified: true
      },
      content: "",
      images: ["https://via.placeholder.com/400x500/333333/FFFFFF?text=Profile+Photo"],
      likes: 128,
      comments: 32,
      shares: 8,
      time: "刚刚",
      location: "",
      isLargeImage: true
    },
    {
      id: 2,
      user: {
        name: "张梦梦",
        avatar: "https://via.placeholder.com/40x40/52C41A/FFFFFF?text=梦",
        verified: false
      },
      content: "例案分享!大一生学调理一的周效果分享,伙伴们都说玉竹的果效太赞了👍,两条量的也不大,这么显明的好转。慧智妈妈选择期假给孩子调理身体,假期督监孩子时按吃膏,争取假把期一学期成造的身体",
      images: [
        "https://via.placeholder.com/150x150/FF6B6B/FFFFFF?text=7.21",
        "https://via.placeholder.com/150x150/4ECDC4/FFFFFF?text=7.28"
      ],
      likes: 89,
      comments: 15,
      shares: 3,
      time: "2小时前",
      location: "赣州市·宝妈来吧爱尔小儿推拿(于都店)"
    },
    {
      id: 3,
      user: {
        name: "刘经萍-上殴姨女儿",
        avatar: "https://via.placeholder.com/40x40/FF9F43/FFFFFF?text=刘",
        verified: false
      },
      content: "吃饭 😊",
      images: [
        "https://via.placeholder.com/120x120/FFA726/FFFFFF?text=锅",
        "https://via.placeholder.com/120x120/8D6E63/FFFFFF?text=碗",
        "https://via.placeholder.com/120x120/4CAF50/FFFFFF?text=桌"
      ],
      likes: 45,
      comments: 8,
      shares: 2,
      time: "3小时前",
      location: "赣州市・幸福家园小区"
    }
  ]);

  const [likedPosts, setLikedPosts] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const handler = useRef(null);
  const containerRef = useRef(null);

  useMount(() => {
    console.log('entry', document.documentElement.clientWidth);

    // 模拟初始数据加载
    setTimeout(() => {
      setInitialLoading(false);
    }, 2000);
  });

  // 生成更多帖子数据的函数
  const generateMorePosts = useCallback(() => {
    const newPosts = [];
    const baseId = posts.length;

    for (let i = 0; i < 5; i++) {
      const postId = baseId + i + 1;
      const userNames = ["小明", "小红", "小李", "小王", "小张", "小赵", "小钱", "小孙"];
      const contents = [
        "今天天气真不错，适合出去走走 🌞",
        "分享一个有趣的小故事，希望大家喜欢 😊",
        "刚完成了一个重要的项目，感觉很有成就感 💪",
        "周末和朋友一起聚餐，美食让人心情愉悦 🍕",
        "学习新技能的过程虽然辛苦，但收获满满 📚",
        "运动后的感觉真好，身体和心情都很棒 🏃‍♂️",
        "和家人一起的时光总是最珍贵的 ❤️",
        "工作中的小确幸，同事们的支持让我很感动 🤝"
      ];

      newPosts.push({
        id: postId,
        user: {
          name: userNames[postId % userNames.length],
          avatar: `https://via.placeholder.com/40x40/${Math.floor(Math.random() * 16777215).toString(16)}/FFFFFF?text=${userNames[postId % userNames.length].charAt(0)}`,
          verified: Math.random() > 0.7
        },
        content: contents[postId % contents.length],
        images: Math.random() > 0.3 ? [
          `https://via.placeholder.com/150x150/${Math.floor(Math.random() * 16777215).toString(16)}/FFFFFF?text=IMG${postId}`,
          ...(Math.random() > 0.5 ? [`https://via.placeholder.com/150x150/${Math.floor(Math.random() * 16777215).toString(16)}/FFFFFF?text=IMG${postId + 1}`] : [])
        ] : [],
        likes: Math.floor(Math.random() * 200) + 10,
        comments: Math.floor(Math.random() * 50) + 5,
        shares: Math.floor(Math.random() * 20) + 1,
        time: `${Math.floor(Math.random() * 24) + 1}小时前`,
        location: Math.random() > 0.5 ? "赣州市・某小区" : "",
        isLargeImage: Math.random() > 0.8
      });
    }

    return newPosts;
  }, [posts.length]);

  // 刷新数据
  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 重置到初始数据
    const initialPosts = [
      {
        id: 1,
        user: {
          name: "大梦一场的张先生",
          avatar: "https://via.placeholder.com/40x40/4A90E2/FFFFFF?text=张",
          verified: true
        },
        content: "刚刚发布了一条新动态！",
        images: ["https://via.placeholder.com/400x500/333333/FFFFFF?text=New+Photo"],
        likes: 128,
        comments: 32,
        shares: 8,
        time: "刚刚",
        location: "",
        isLargeImage: true
      },
      {
        id: 2,
        user: {
          name: "张梦梦",
          avatar: "https://via.placeholder.com/40x40/52C41A/FFFFFF?text=梦",
          verified: false
        },
        content: "例案分享!大一生学调理一的周效果分享,伙伴们都说玉竹的果效太赞了👍,两条量的也不大,这么显明的好转。慧智妈妈选择期假给孩子调理身体,假期督监孩子时按吃膏,争取假把期一学期成造的身体",
        images: [
          "https://via.placeholder.com/150x150/FF6B6B/FFFFFF?text=7.21",
          "https://via.placeholder.com/150x150/4ECDC4/FFFFFF?text=7.28"
        ],
        likes: 89,
        comments: 15,
        shares: 3,
        time: "2小时前",
        location: "赣州市·宝妈来吧爱尔小儿推拿(于都店)"
      },
      {
        id: 3,
        user: {
          name: "刘经萍-上殴姨女儿",
          avatar: "https://via.placeholder.com/40x40/FF9F43/FFFFFF?text=刘",
          verified: false
        },
        content: "吃饭 😊",
        images: [
          "https://via.placeholder.com/120x120/FFA726/FFFFFF?text=锅",
          "https://via.placeholder.com/120x120/8D6E63/FFFFFF?text=碗",
          "https://via.placeholder.com/120x120/4CAF50/FFFFFF?text=桌"
        ],
        likes: 45,
        comments: 8,
        shares: 2,
        time: "3小时前",
        location: "赣州市・幸福家园小区"
      }
    ];

    setPosts(initialPosts);
    setPage(1);
    setHasMore(true);
    setLikedPosts(new Set());
    setRefreshing(false);
  }, []);

  // 加载更多数据
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);

    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newPosts = generateMorePosts();
    setPosts(prev => [...prev, ...newPosts]);
    setPage(prev => prev + 1);

    // 模拟数据加载完毕的情况（第10页后停止加载）
    if (page >= 2) {
      setHasMore(false);
    }

    setLoading(false);
  }, [loading, hasMore, page, generateMorePosts]);

  // 滚动监听
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const threshold = 100; // 距离底部100px时开始加载

    if (scrollHeight - scrollTop - clientHeight < threshold && !loading && hasMore) {
      loadMore();
    }
  }, [loading, hasMore, loadMore]);

  // 添加滚动监听
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleLike = (postId) => {
    setLikedPosts(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(postId)) {
        newLiked.delete(postId);
      } else {
        newLiked.add(postId);
      }
      return newLiked;
    });

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: likedPosts.has(postId) ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  const handleImageClick = (images, index) => {
    ImageViewer.Multi.show({ images: images, defaultIndex: index })
  };

  const handleMore = (postId) => {
    const actions = [
      {
        text: '删除',
        key: 'delete',
        description: '删除后数据不可恢复',
        danger: true,
        bold: true,
        onClick: () => {
          console.log('删除', postId);
          handler.current?.close();
        },
      },
    ];

    handler.current = ActionSheet.show({
      // extra: '更多操作',
      cancelText: '取消',
      actions,
    });
  };

  // 骨架屏组件
  const PostSkeleton = () => (
    <div className={styles.postContainer}>
      <div className={styles.postHeader}>
        <div className={styles.userInfo}>
          <Skeleton animated className={styles.skeletonAvatar} />
          <div className={styles.userDetails}>
            <Skeleton animated className={styles.skeletonName} />
            <Skeleton animated className={styles.skeletonMeta} />
          </div>
        </div>
        <Skeleton animated className={styles.skeletonMore} />
      </div>

      <Skeleton animated className={styles.skeletonContent} />

      <div className={styles.skeletonImages}>
        <Skeleton animated className={styles.skeletonImage} />
        <Skeleton animated className={styles.skeletonImage} />
        <Skeleton animated className={styles.skeletonImage} />
      </div>

      <div className={styles.postActions}>
        <Skeleton animated className={styles.skeletonAction} />
        <Skeleton animated className={styles.skeletonAction} />
      </div>
    </div>
  );

  const renderPost = (post) => (
    <div key={post.id} className={styles.postContainer}>
      <div className={styles.postHeader}>
        <div className={styles.userInfo}>
          <Avatar src={post.user.avatar} className={styles.userAvatar} />
          <div className={styles.userDetails}>
            <div className={styles.userName}>
              {post.user.name}
              {post.user.verified && <span className={styles.verifiedBadge}>✓</span>}
            </div>
            <div className={styles.postMeta}>
              {/* <TimeOutline className="meta-icon" /> */}
              <span>{post.time}</span>
              {post.location && (
                <>
                  <LocationOutline className={styles.metaIcon} />
                  <span>{post.location}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <MoreOutline onClick={() => handleMore(post.id)} className={styles.moreIcon} />
      </div>

      {post.content && (
        <div className={styles.postContent}>
          {post.content}
        </div>
      )}

      {post.images && post.images.length > 0 && (
        <div className={`${styles.postImages} ${post.isLargeImage ? styles.largeImage : styles.gridImages}`}>
          {post.images.map((image, index) => (
            <div key={index} onClick={() => handleImageClick(post.images, index)} className={styles.imageWrapper}>
              <Image
                src={image}
                width="100%"
                height="100%"
                fit="cover"
                className={styles.postImage}
              />
            </div>
          ))}
        </div>
      )}

      <div className={styles.postActions}>
        <div className={styles.actionItem} onClick={() => handleLike(post.id)}>
          <HeartOutline
            className={`${styles.actionIcon} ${likedPosts.has(post.id) ? styles.liked : ''}`}
          />
          <span className={likedPosts.has(post.id) ? styles.liked : ''}>
            {post.likes}
          </span>
        </div>
        <div className={styles.actionItem}>
          <MessageOutline className={styles.actionIcon} />
          <span>{post.comments}</span>
        </div>
        {/* <div className="action-item">
          <ShareOutline className="action-icon" />
          <span>{post.shares}</span>
        </div> */}
      </div>
    </div>
  );

  return (
    <div className={styles.entryContainer}>
      <SafeArea position='top' />
      <div className={styles.header}>
        <h1 className={styles.appTitle}>瞬间📝记录</h1>
        <div className={styles.headerActions}>
          <Button
            size="small"
            onClick={() => navigate("/create")}
            className={styles.createBtn}
          >
            发布
          </Button>
          <Button
            size="small"
            fill="outline"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            style={{ marginLeft: '8px' }}
          >
            登出
          </Button>
        </div>
      </div>
      <div
        ref={containerRef}
        className={styles.postsFeed}
      >
        <PullToRefresh
          onRefresh={onRefresh}
          refreshing={refreshing}
          completeDelay={500}
        >
          {/* 初始加载骨架屏 */}
          {initialLoading ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : (
            <>
              {posts.map(renderPost)}

              {/* 加载状态 */}
              {loading && (
                <div className={styles.loadingContainer}>
                  <span className={styles.loadingText}>加载中</span>
                  <DotLoading />
                </div>
              )}

              {/* 没有更多数据 */}
              {!hasMore && posts.length > 0 && (
                <div className={styles.noMoreContainer}>
                  <span className={styles.noMoreText}>没有更多内容了</span>
                </div>
              )}
            </>
          )}
        </PullToRefresh>
      </div>
      <SafeArea position='bottom' />
    </div>
  );
};

export default Entry;