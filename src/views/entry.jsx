import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button, Avatar, Image,
  ImageViewer, DotLoading,
  SafeArea, PullToRefresh,
  Skeleton, ActionSheet,
  Toast, ErrorBlock
} from "antd-mobile";
import { useMount } from "ahooks";
import { useAuth } from "../utils/authContext";
import { recordsApi } from "../utils/api";
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
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const handler = useRef(null);
  const containerRef = useRef(null);

  // 转换API数据为前端展示格式
  const transformRecordToPost = (record) => {
    // 解析媒体内容
    let images = [];
    if (record.content_media) {
      try {
        const mediaData = JSON.parse(record.content_media);
        if (Array.isArray(mediaData)) {
          images = mediaData;
        }
      } catch (error) {
        console.error('解析媒体内容失败:', error);
      }
    }

    // 计算时间差
    const getTimeAgo = (createdAt) => {
      if (!createdAt) return '刚刚';
      const now = new Date();
      const created = new Date(createdAt);
      const diffMs = now - created;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        return `${diffDays}天前`;
      } else if (diffHours > 0) {
        return `${diffHours}小时前`;
      } else {
        return '刚刚';
      }
    };

    return {
      id: record.id,
      user: {
        name: record.creator?.name || `用户${record.creator_id}`,
        avatar: record.creator?.avatar || `https://via.placeholder.com/40x40/${Math.floor(Math.random() * 16777215).toString(16)}/FFFFFF?text=${(record.creator?.name || 'U').charAt(0)}`,
        verified: record.creator?.role === 'admin'
      },
      content: record.content_text || '',
      images: images,
      likes: record.extra_data?.likes || Math.floor(Math.random() * 200) + 10,
      comments: record.extra_data?.comments || Math.floor(Math.random() * 50) + 5,
      shares: record.extra_data?.shares || Math.floor(Math.random() * 20) + 1,
      time: getTimeAgo(record.created_at),
      location: record.extra_data?.location || '',
      isLargeImage: images.length === 1 && Math.random() > 0.5
    };
  };

  // 获取记录数据
  const fetchRecords = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      setLoading(true);
      const response = await recordsApi.getRecords({
        page: pageNum,
        limit: 10
      });

      const transformedPosts = response.records?.map(transformRecordToPost) || [];

      if (isRefresh) {
        setPosts(transformedPosts);
      } else {
        setPosts(prev => [...prev, ...transformedPosts]);
      }

      setPagination(response.pagination || {});
      setHasMore(response.pagination?.has_next || false);

    } catch (error) {
      console.error('获取记录失败:', error);
      Toast.show({
        content: '获取数据失败，请重试',
        position: 'center',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useMount(() => {
    fetchRecords(1, true).finally(() => {
      setInitialLoading(false);
    });
  });

  // 刷新数据
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecords(1, true);
    setPage(1);
    setLikedPosts(new Set());
    setRefreshing(false);
  }, [fetchRecords]);

  // 加载更多数据
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    const nextPage = page + 1;
    await fetchRecords(nextPage, false);
    setPage(nextPage);
  }, [loading, hasMore, page, fetchRecords]);

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
        onClick: async () => {
          try {
            await recordsApi.deleteRecord(postId);
            setPosts(prev => prev.filter(post => post.id !== postId));
            Toast.show({
              content: '删除成功',
              position: 'center',
            });
          } catch (error) {
            console.error('删除失败:', error);
            Toast.show({
              content: '删除失败，请重试',
              position: 'center',
            });
          }
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
          {user && user.role === 'admin' && (
            <Button
              size="small"
              onClick={() => navigate("/create")}
              className={styles.createBtn}
            >
              发布
            </Button>
          )}
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
              {
                posts.length === 0 && (
                  <ErrorBlock
                    status="empty"
                    title="暂无内容"
                    description={
                      <div>
                        可点击前往
                        <a href="/create" style={{ marginLeft: 2 }}>发布</a>
                      </div>
                    }
                  />
                )
              }
            </>
          )}
        </PullToRefresh>
      </div>
      <SafeArea position='bottom' />
    </div>
  );
};

export default Entry;