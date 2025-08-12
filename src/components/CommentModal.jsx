import React, { useState, useRef, useEffect } from 'react';
import {
  Popup,
  Button,
  TextArea,
  Avatar,
  ActionSheet,
  Toast,
  SafeArea
} from 'antd-mobile';
import { CloseOutline, DeleteOutline } from 'antd-mobile-icons';
import { useAuth } from '../utils/authContext';
import styles from './CommentModal.module.css';

const CommentModal = ({ 
  visible, 
  onClose, 
  post, 
  onAddComment, 
  onDeleteComment 
}) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const textAreaRef = useRef(null);
  const handler = useRef(null);

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return '刚刚';
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `${diffDays}天前`;
    } else if (diffHours > 0) {
      return `${diffHours}小时前`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}分钟前`;
    } else {
      return '刚刚';
    }
  };

  // 提交评论
  const handleSubmit = async () => {
    if (!commentText.trim()) {
      Toast.show({
        content: '请输入评论内容',
        position: 'center',
      });
      return;
    }

    if (!post?.id) {
      Toast.show({
        content: '帖子信息异常，请刷新重试',
        position: 'center',
      });
      return;
    }

    if (!onAddComment || typeof onAddComment !== 'function') {
      console.error('onAddComment prop is not a function');
      Toast.show({
        content: '系统异常，请重试',
        position: 'center',
      });
      return;
    }

    setSubmitting(true);
    try {
      await onAddComment(post.id, commentText);
      setCommentText('');
      // 清空输入框
      if (textAreaRef.current) {
        textAreaRef.current.clear();
      }
      
      Toast.show({
        content: '评论成功',
        position: 'center',
      });
    } catch (error) {
      console.error('提交评论失败:', error);
      Toast.show({
        content: error.message || '评论失败，请重试',
        position: 'center',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 处理评论长按
  const handleCommentLongPress = (comment) => {
    // 只有评论作者或管理员可以删除评论
    if (user && (comment.userId === user.id || user.role === 'admin')) {
      const actions = [
        {
          text: '删除评论',
          key: 'delete',
          danger: true,
          onClick: async () => {
            try {
              await onDeleteComment(post.id, comment.id);
            } catch (error) {
              console.error('删除评论失败:', error);
            }
            handler.current?.close();
          },
        },
      ];

      handler.current = ActionSheet.show({
        cancelText: '取消',
        actions,
      });
    }
  };

  // 键盘高度监听
  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return;
    }

    let timeoutId = null;
    let isViewportSupported = false;

    const updateKeyboardHeight = (heightDiff) => {
      const newKeyboardHeight = heightDiff > 100 ? Math.min(heightDiff, 400) : 0;
      setKeyboardHeight(newKeyboardHeight);
    };

    const handleViewportChange = () => {
      if (timeoutId) clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        if (window.visualViewport) {
          const viewportHeight = window.visualViewport.height;
          const windowHeight = window.innerHeight;
          const heightDiff = windowHeight - viewportHeight;
          updateKeyboardHeight(heightDiff);
        }
      }, 50);
    };

    // 优先使用 visualViewport API
    if (window.visualViewport) {
      isViewportSupported = true;
      window.visualViewport.addEventListener('resize', handleViewportChange);
      // 初始化检查
      handleViewportChange();
    } else {
      // 兼容性回退：使用window resize
      const handleResize = () => {
        if (timeoutId) clearTimeout(timeoutId);
        
        timeoutId = setTimeout(() => {
          // 使用更可靠的高度计算
          const currentHeight = window.innerHeight;
          const documentHeight = document.documentElement.clientHeight;
          const heightDiff = Math.max(documentHeight - currentHeight, 0);
          updateKeyboardHeight(heightDiff);
        }, 50);
      };

      window.addEventListener('resize', handleResize);
    }

    // 清理函数
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      if (isViewportSupported) {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleResize);
      }
      
      setKeyboardHeight(0);
    };
  }, [visible]);

  // 当弹窗打开时聚焦输入框
  useEffect(() => {
    if (visible && textAreaRef.current) {
      const timer = setTimeout(() => {
        textAreaRef.current.focus();
      }, 300); // 等待弹窗动画完成
      
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // 数据验证和安全处理
  const comments = React.useMemo(() => {
    if (!post?.commentsData || !Array.isArray(post.commentsData)) {
      return [];
    }
    
    return post.commentsData.filter(comment => 
      comment && 
      typeof comment === 'object' && 
      comment.id && 
      comment.content
    );
  }, [post?.commentsData]);

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      position='bottom'
      bodyStyle={{ 
        height: '70vh',
        maxHeight: keyboardHeight > 0 ? `calc(100vh - ${keyboardHeight}px - 20px)` : '70vh',
        transition: 'max-height 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}
      className={styles.commentModal}
    >
      <div className={styles.modalHeader}>
        <div className={styles.headerTitle}>
          评论 ({comments.length})
        </div>
        <CloseOutline 
          className={styles.closeIcon} 
          onClick={onClose}
        />
      </div>

      <div className={styles.modalBody}>
        {/* 评论列表 */}
        <div className={styles.commentsList}>
          {comments.length === 0 ? (
            <div className={styles.emptyComments}>
              <div className={styles.emptyText}>暂无评论</div>
              <div className={styles.emptySubText}>来抢沙发吧～</div>
            </div>
          ) : (
            comments.map((comment) => (
              <div 
                key={comment.id} 
                className={styles.commentItem}
              >
                <Avatar 
                  src={comment.avatar}
                  className={styles.commentAvatar}
                />
                <div className={styles.commentContent}>
                  <div className={styles.commentHeader}>
                    <span className={styles.commentUser}>{comment.userName}</span>
                    <span className={styles.commentTime}>{formatTime(comment.timestamp)}</span>
                  </div>
                  <div className={styles.commentText}>{comment.content}</div>
                </div>
                {user && (comment.userId === user.id || user.role === 'admin') && (
                  <DeleteOutline 
                    className={styles.deleteIcon}
                    onClick={() => handleCommentLongPress(comment)}
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* 评论输入区域 */}
        <div 
          className={styles.commentInput}
          style={{
            transform: keyboardHeight > 0 ? `translateY(-${Math.min(keyboardHeight * 0.8, 300)}px)` : 'translateY(0)',
            transition: 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}
        >
          <div className={styles.inputContainer}>
            <Avatar 
              src={user?.avatar}
              className={styles.inputAvatar}
            />
            <TextArea
              ref={textAreaRef}
              placeholder="写下你的评论..."
              value={commentText}
              onChange={setCommentText}
              autoSize={{ minRows: 1, maxRows: 3 }}
              className={styles.textArea}
            />
            <Button
              size="small"
              color="primary"
              disabled={!commentText.trim() || submitting}
              loading={submitting}
              onClick={handleSubmit}
              className={styles.submitBtn}
            >
              发送
            </Button>
          </div>
        </div>
      </div>
      <SafeArea position='bottom' />
    </Popup>
  );
};

export default CommentModal;
