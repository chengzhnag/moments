

export function commonUploadFile(file) {
  return new Promise(async (resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://open.952737.xyz/api/upload-file', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      console.log('上传成功:', result.data);
      resolve({
        url: result.data.url,
        thumbnailUrl: result.data.thumbnailUrl,
        key: result.data.key,
        type: result.data.mimeType ? result.data.mimeType.startsWith('video/') ? 'video' : 'image' : 'image',
      });
    } else {
      const error = await response.json();
      console.log('上传失败:', error.error);
      reject(error.error);
    }
  });
}

/**
 * 防抖包装器：用于延迟执行函数，仅在最后一次调用后延迟期结束才执行
 * 支持 async/await 函数
 * @param {Function} func - 要防抖的异步或同步函数
 * @param {number} delay - 延迟毫秒数（如 300ms）
 * @returns {Function} 包装后的防抖函数
 */
export function debounce(func, delay = 300) {
  let timer = null;

  return function (...args) {
    // 使用箭头函数确保 this 和 arguments 正确传递
    const context = this;

    return new Promise((resolve, reject) => {
      // 清除之前的定时器
      if (timer) {
        clearTimeout(timer);
      }

      // 设置新定时器
      timer = setTimeout(async () => {
        try {
          // 执行原函数，并等待其完成（支持 async）
          const result = await func.apply(context, args);
          resolve(result); // 返回结果
        } catch (error) {
          reject(error); // 捕获异常并返回
        }
      }, delay);
    });
  };
}

