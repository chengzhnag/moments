

export function commonUploadFile(file) {
  return new Promise(async (resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://img.241125.xyz/upload-file', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      console.log('上传成功:', result.data);
      resolve({ url: result.data });
    } else {
      const error = await response.json();
      console.log('上传失败:', error.error);
      reject(error.error);
    }
  });
}

