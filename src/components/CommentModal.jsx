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
  const [isKeyboardAnimating, setIsKeyboardAnimating] = useState(false);
  const textAreaRef = useRef(null);
  const handler = useRef(null);
  const animationTimeoutRef = useRef(null);

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

    setSubmitting(true);
    try {
      await onAddComment(post.id, commentText);
      setCommentText('');
      // 清空输入框
      if (textAreaRef.current) {
        textAreaRef.current.clear();
      }
    } catch (error) {
      console.error('提交评论失败:', error);
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

  // 键盘高度监听 - 优化版本
  useEffect(() => {
    if (!visible) return;

    let initialViewportHeight = window.innerHeight;
    let initialVisualViewportHeight = window.visualViewport?.height || window.innerHeight;
    
    // 获取安全区域高度
    const getSafeAreaBottom = () => {
      const style = getComputedStyle(document.documentElement);
      const safeAreaBottom = style.getPropertyValue('env(safe-area-inset-bottom)') || '0px';
      return parseInt(safeAreaBottom) || 0;
    };

    const handleViewportChange = () => {
      if (window.visualViewport) {
        const currentViewportHeight = window.visualViewport.height;
        const safeAreaBottom = getSafeAreaBottom();
        
        // 计算键盘高度，减去安全区域高度
        const newKeyboardHeight = Math.max(0, initialVisualViewportHeight - currentViewportHeight - safeAreaBottom);
        
        // 只有当键盘高度超过一定阈值时才认为键盘弹起
        const finalHeight = newKeyboardHeight > 100 ? newKeyboardHeight : 0;
        
        // 设置动画状态
        if (finalHeight !== keyboardHeight) {
          setIsKeyboardAnimating(true);
          setKeyboardHeight(finalHeight);
          
          // 清除之前的定时器
          if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
          }
          
          // 动画结束后重置状态
          animationTimeoutRef.current = setTimeout(() => {
            setIsKeyboardAnimating(false);
          }, 250); // 与CSS动画时间保持一致
        }
      }
    };

    // 兼容性处理：监听窗口大小变化
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const safeAreaBottom = getSafeAreaBottom();
      
      // 计算键盘高度
      const newKeyboardHeight = Math.max(0, initialViewportHeight - currentHeight - safeAreaBottom);
      const finalHeight = newKeyboardHeight > 100 ? newKeyboardHeight : 0;
      
      // 设置动画状态
      if (finalHeight !== keyboardHeight) {
        setIsKeyboardAnimating(true);
        setKeyboardHeight(finalHeight);
        
        // 清除之前的定时器
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
        
        // 动画结束后重置状态
        animationTimeoutRef.current = setTimeout(() => {
          setIsKeyboardAnimating(false);
        }, 250);
      }
    };

    // 记录初始高度
    if (window.visualViewport) {
      initialVisualViewportHeight = window.visualViewport.height;
    }
    initialViewportHeight = window.innerHeight;

    // 监听视口变化
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
      
      return () => {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportChange);
          window.visualViewport.removeEventListener('scroll', handleViewportChange);
        }
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
        setKeyboardHeight(0);
        setIsKeyboardAnimating(false);
      };
    } else {
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
        setKeyboardHeight(0);
        setIsKeyboardAnimating(false);
      };
    }
  }, [visible]);

  const comments = post?.commentsData || [];

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      position='bottom'
      bodyStyle={{ 
        height: '70vh',
        maxHeight: '70vh',
        transition: 'height 0.3s ease-out, max-height 0.3s ease-out'
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
          className={`${styles.commentInput} ${keyboardHeight > 0 ? styles.keyboardActive : ''} ${isKeyboardAnimating ? styles.animating : ''}`}
          style={{
            '--keyboard-height': `${keyboardHeight}px`,
            transform: keyboardHeight > 0 ? `translateY(-${keyboardHeight}px)` : 'translateY(0)',
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