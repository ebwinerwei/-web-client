import React, { useState, useEffect } from 'react';
import { useModel, history } from '@umijs/max';
import { api } from '@/utils/api';
import useResolution from '../../hooks/useResolution';
import { message } from 'antd';
import { useRecoilState } from 'recoil';
import { useDebounceFn } from 'ahooks';
import COS from '@/components/Cos';
import { t } from '@/utils/lang';
import { fileState } from '../../store/Atoms';
import emitter, { EVENT_FILE_UPLOAD } from '../../event';

type FileSelectProps = {
  onSelection: (file: File, url: string) => void;
};

export default function FileSelect(props: FileSelectProps) {
  const { onSelection } = props;
  const [file, setFile] = useRecoilState(fileState);

  const [dragHover, setDragHover] = useState(false);
  const [uploadElemId] = useState(`file-upload-${Math.random().toString()}`);

  useEffect(() => {
    const fun = async () => {
      const lama_img = localStorage.getItem('lama_img');
      if (lama_img) {
        localStorage.removeItem('lama_img');
        const file = await imageUrlToFile(lama_img);
        onFileSelected(file);
      }
      console.log('lama_img', lama_img);
    };
    fun();
  }, []);

  useEffect(() => {
    emitter.on(EVENT_FILE_UPLOAD, (data: any) => {
      console.log('sadasdasd', data);
      onFileSelected(data);
    });
  }, []);

  async function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas to Blob conversion failed'));
        }
      });
    });
  }

  async function blobToByteArray(blob) {
    return new Uint8Array(await new Response(blob).arrayBuffer());
  }

  const { run: onFileSelected } = useDebounceFn(
    async (file: File) => {
      if (!file) {
        return;
      }
      // Skip non-image files
      const isImage = file.type.match('image.*');
      if (!isImage) {
        return;
      }
      try {
        // Check if file is larger than 3mb
        if (file.size > 3 * 1024 * 1024) {
          throw new Error(t('文件过大'));
        }
        console.log('file.name.split(".")[0]', file.name.split('.')[0]);
        const image = new Image();
        image.onload = async (e) => {
          console.log('eeeeee', image);
          // for keeping original sized image
          const tmp_canvas = document.createElement('canvas');
          tmp_canvas.width = image.width;
          tmp_canvas.height = image.height;
          if (image.width >= 2000 || image.height >= 2000) {
            message.info(t('图片尺寸过大，宽高不得超过2000'));
            return;
          }
          const ctx = tmp_canvas.getContext('2d');
          ctx.drawImage(image, 0, 0);
          // for keeping original sized mask

          const imageBlob = await canvasToBlob(tmp_canvas);
          const imageByteArray = await blobToByteArray(imageBlob);

          const formData = new FormData();
          formData.append('image', new Blob([imageByteArray]), 'image.png');
          const overlay = document.createElement('div');
          overlay.style.position = 'fixed';
          overlay.style.top = '0';
          overlay.style.left = '0';
          overlay.style.width = '100%';
          overlay.style.height = '100%';
          overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          overlay.style.zIndex = '21';
          overlay.style.display = 'flex';
          overlay.style.justifyContent = 'center';
          overlay.style.alignItems = 'center';
          // 将遮罩添加到文档中
          document.body.appendChild(overlay);
          overlay.parentNode.removeChild(overlay);

          const key = `${new Date().getTime()}_${file.size}.png`;
          COS.uploadFile(
            {
              Bucket: 'blue-user-1304000175' /* 填入您自己的存储桶，必须字段 */,
              Region: 'ap-tokyo' /* 存储桶所在地域，例如ap-beijing，必须字段 */,
              Key: key /* 存储在桶里的对象键（例如1.jpg，a/b/test.txt），必须字段 */,
              Body: file /* 必须，上传文件对象，可以是input[type="file"]标签选择本地文件后得到的file对象 */,
              // 支持自定义headers 非必须
            },
            (err, data) => {
              console.log(err || data.Location);
              if (!data.Location) {
                message.error(t('图片上传失败'));
                return;
              }
              onSelection(file, data.Location);
            },
          );
        };
        image.src = URL.createObjectURL(file);
      } catch (e) {
        // eslint-disable-next-line
        alert(`error: ${(e as any).message}`);
      }
    },
    {
      wait: 500,
    },
  );

  async function getFile(entry: any): Promise<File> {
    return new Promise((resolve) => {
      entry.file((file: File) => resolve(file));
    });
  }

  async function imageUrlToFile(imageUrl: string) {
    // 使用 Fetch API 获取图片数据
    const response = await fetch(imageUrl);
    const blobData = await response.blob();

    // 创建一个新的 File 对象
    const fileName = 'newFileName.jpg'; // 可以根据需要指定文件名
    const fileType = blobData.type;

    const file = new File([blobData], fileName, { type: fileType });

    return file;
  }

  /* eslint-disable no-await-in-loop */

  // Drop handler function to get all files
  async function getAllFileEntries(items: DataTransferItemList) {
    const fileEntries: Array<File> = [];
    // Use BFS to traverse entire directory/file structure
    const queue = [];
    // Unfortunately items is not iterable i.e. no forEach
    for (let i = 0; i < items.length; i += 1) {
      queue.push(items[i].webkitGetAsEntry());
    }
    while (queue.length > 0) {
      const entry = queue.shift();
      if (entry?.isFile) {
        // Only append images
        const file = await getFile(entry);
        fileEntries.push(file);
      } else if (entry?.isDirectory) {
        queue.push(...(await readAllDirectoryEntries((entry as any).createReader())));
      }
    }
    return fileEntries;
  }

  // Get all the entries (files or sub-directories) in a directory
  // by calling readEntries until it returns empty array
  async function readAllDirectoryEntries(directoryReader: any) {
    const entries = [];
    let readEntries = await readEntriesPromise(directoryReader);
    while (readEntries.length > 0) {
      entries.push(...readEntries);
      readEntries = await readEntriesPromise(directoryReader);
    }
    return entries;
  }

  /* eslint-enable no-await-in-loop */

  // Wrap readEntries in a promise to make working with readEntries easier
  // readEntries will return only some of the entries in a directory
  // e.g. Chrome returns at most 100 entries at a time
  async function readEntriesPromise(directoryReader: any): Promise<any> {
    return new Promise((resolve, reject) => {
      directoryReader.readEntries(resolve, reject);
    });
  }

  async function handleDrop(ev: React.DragEvent) {
    ev.preventDefault();
    const items = await getAllFileEntries(ev.dataTransfer.items);
    setDragHover(false);
    onFileSelected(items[0]);
  }

  return (
    <label htmlFor={uploadElemId} className="file-select-label">
      <div
        className={['file-select-container', dragHover ? 'file-select-label-hover' : ''].join(' ')}
        onDrop={handleDrop}
        onDragOver={(ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          setDragHover(true);
        }}
        onDragLeave={() => setDragHover(false)}
      >
        <input
          id={uploadElemId}
          name={uploadElemId}
          type="file"
          onChange={(ev) => {
            const file = ev.currentTarget.files?.[0];
            console.log('file', file);
            if (file) {
              onFileSelected(file);
            }
          }}
          accept="image/png, image/jpeg, image/webp"
        />
        <img src={'/imgs/icon_tpsc.png'} className="icon-draw" />
        <p className="file-select-message">{t('拖拽底图到这里，或者点击上传')}</p>
      </div>
    </label>
  );
}
