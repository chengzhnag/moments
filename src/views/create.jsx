import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  NavBar, Form, Input, Button, ImageUploader,
  Toast, SafeArea, TextArea, Space, Divider,
  ImageViewer, Popup, List, Radio
} from "antd-mobile";
import {
  LeftOutline,
  PictureOutline,
  LocationOutline,
  SmileOutline,
  CloseOutline
} from 'antd-mobile-icons';
import { useAuth } from "../utils/authContext";
import { recordsApi } from "../utils/api";
import styles from './create.module.css';

const Create = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);

  // 模拟位置数据
  const locationOptions = [
    { label: '赣州市・幸福家园小区', value: '赣州市・幸福家园小区' },
    { label: '赣州市・宝妈来吧爱尔小儿推拿(于都店)', value: '赣州市・宝妈来吧爱尔小儿推拿(于都店)' },
    { label: '赣州市・某小区', value: '赣州市・某小区' },
    { label: '不显示位置', value: '' }
  ];

  // 表情符号选项
  const emojiOptions = [
    '😊', '😂', '🤔', '👍', '❤️', '😍', '😭', '😡',
    '🤗', '😴', '🤩', '😎', '🤠', '👻', '🤖', '👽',
    '🎉', '🎊', '🎈', '🎁', '🎂', '🎄', '🎃', '🎗️',
    '🌞', '🌙', '⭐', '🌈', '☀️', '🌤️', '⛅', '🌥️',
    '🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥨', '🥯',
    '🏃‍♂️', '🚴‍♂️', '🏊‍♂️', '⚽', '🏀', '🎾', '🏸', '🎯'
  ];

  // 处理图片上传
  const handleImageUpload = async (file) => {
    try {
      // 这里应该调用真实的上传API
      // 目前使用模拟上传
      const mockUpload = () => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              url: reader.result,
              name: file.name
            });
          };
          reader.readAsDataURL(file);
        });
      };

      const result = await mockUpload();
      return result;
    } catch (error) {
      console.error('图片上传失败:', error);
      Toast.show({
        content: '图片上传失败',
        position: 'center',
      });
      return null;
    }
  };

  // 删除图片
  const handleImageDelete = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // 预览图片
  const handleImagePreview = (index) => {
    ImageViewer.Multi.show({
      images: images.map(img => img.url),
      defaultIndex: index,
    });
  };

  // 添加表情
  const handleEmojiSelect = (emoji) => {
    const currentContent = form.getFieldValue('content') || '';
    form.setFieldValue('content', currentContent + emoji);
    setShowEmojiPicker(false);
  };

  // 选择位置
  const handleLocationSelect = (value) => {
    setLocation(value);
    setShowLocationPicker(false);
  };

  // 提交表单
  const handleSubmit = async (values) => {
    if (!values.content && images.length === 0) {
      Toast.show({
        content: '请输入内容或上传图片',
        position: 'center',
      });
      return;
    }

    setLoading(true);
    try {
      const recordData = {
        creator_id: user?.id || 1, // 使用当前用户ID
        content_text: values.content || '',
        content_media: images.length > 0 ? JSON.stringify(images.map(img => img.url)) : null,
        extra_data: {
          location: location,
          likes: 0,
          comments: 0,
          shares: 0
        }
      };

      await recordsApi.createRecord(recordData);

      Toast.show({
        content: '发布成功',
        position: 'center',
        icon: 'success',
      });

      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        navigate('/entry');
      }, 1500);

    } catch (error) {
      console.error('发布失败:', error);
      Toast.show({
        content: '发布失败，请重试',
        position: 'center',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.createContainer}>
      <SafeArea position='top' />

      {/* 导航栏 */}
      <NavBar
        onBack={() => navigate('/entry')}
        backArrow={<LeftOutline />}
        right={
          <Button
            size='small'
            color='primary'
            loading={loading}
            onClick={() => form.submit()}
            disabled={!form.getFieldValue('content') && images.length === 0}
          >
            发布
          </Button>
        }
      >
        新建动态
      </NavBar>

      {/* 表单内容 */}
      <div className={styles.content}>
        <Form
          form={form}
          onFinish={handleSubmit}
          layout='vertical'
          className={styles.form}
        >
          {/* 用户信息 */}
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              <img
                src={user?.avatar || 'https://via.placeholder.com/40x40/4A90E2/FFFFFF?text=U'}
                alt="avatar"
              />
            </div>
            <div className={styles.userDetails}>
              <div className={styles.userName}>{user?.name || '用户'}</div>
              <div className={styles.userRole}>{user?.role === 'admin' ? '管理员' : '普通用户'}</div>
            </div>
          </div>

          <Divider />

          {/* 内容输入 */}
          <Form.Item name="content" className={styles.contentInput}>
            <TextArea
              placeholder="分享你的瞬间..."
              rows={6}
              maxLength={500}
              showCount
              autoSize={{ minRows: 4, maxRows: 8 }}
            />
          </Form.Item>

          {/* 图片上传 */}
          <div className={styles.imageSection}>
            <ImageUploader
              value={images}
              onChange={setImages}
              upload={handleImageUpload}
              onDelete={handleImageDelete}
              onPreview={handleImagePreview}
              maxCount={9}
              showUpload={images.length < 9}
              className={styles.imageUploader}
            />
          </div>

          {/* 底部工具栏 */}
          <div className={styles.toolbar}>
            <Space>
              {/* 图片上传按钮 */}
              <Button
                fill='none'
                size='small'
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= 9}
              >
                <PictureOutline />
                <span>图片</span>
              </Button>

              {/* 表情选择 */}
              <Button
                fill='none'
                size='small'
                onClick={() => setShowEmojiPicker(true)}
              >
                <SmileOutline />
                <span>表情</span>
              </Button>

              {/* 位置选择 */}
              <Button
                fill='none'
                size='small'
                onClick={() => setShowLocationPicker(true)}
              >
                <LocationOutline />
                <span>{location || '位置'}</span>
              </Button>
            </Space>
          </div>

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = Array.from(e.target.files);
              files.forEach(file => {
                handleImageUpload(file).then(result => {
                  if (result) {
                    setImages(prev => [...prev, result]);
                  }
                });
              });
              e.target.value = '';
            }}
          />
        </Form>
      </div>

      {/* 表情选择弹窗 */}
      <Popup
        visible={showEmojiPicker}
        onMaskClick={() => setShowEmojiPicker(false)}
        position='bottom'
        bodyStyle={{ height: '300px' }}
      >
        <div className={styles.emojiPicker}>
          <div className={styles.emojiHeader}>
            <span>选择表情</span>
            <CloseOutline onClick={() => setShowEmojiPicker(false)} />
          </div>
          <div className={styles.emojiGrid}>
            {emojiOptions.map((emoji, index) => (
              <div
                key={index}
                className={styles.emojiItem}
                onClick={() => handleEmojiSelect(emoji)}
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>
      </Popup>

      {/* 位置选择弹窗 */}
      <Popup
        visible={showLocationPicker}
        onMaskClick={() => setShowLocationPicker(false)}
        position='bottom'
        bodyStyle={{ height: '300px' }}
      >
        <div className={styles.locationPicker}>
          <div className={styles.locationHeader}>
            <span>选择位置</span>
            <CloseOutline onClick={() => setShowLocationPicker(false)} />
          </div>
          <List>
            {locationOptions.map((option) => (
              <List.Item
                key={option.value}
                onClick={() => handleLocationSelect(option.value)}
                arrow={false}
              >
                <Radio
                  checked={location === option.value}
                  onChange={() => handleLocationSelect(option.value)}
                >
                  {option.label}
                </Radio>
              </List.Item>
            ))}
          </List>
        </div>
      </Popup>

      <SafeArea position='bottom' />
    </div>
  );
};

export default Create;