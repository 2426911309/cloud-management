import cv2
import numpy as np
from ultralytics import YOLO
from PIL import Image
import io
import base64
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MeterDetector:
    def __init__(self, model_path='models/best.pt'):
        """
        初始化YOLOv8检测器
        :param model_path: 模型文件路径
        """
        try:
            self.model = YOLO(model_path)
            logger.info("✅ 模型加载成功: {model_path}")
        except Exception as e:
            logger.error("❌ 模型加载失败: {e}")
            raise

    def detect(self, image_input):
        """
        执行表计检测
        :param image_input: 可以是图片路径、numpy数组、或base64编码的字符串
        :return: 检测结果字典
        """
        try:
            # 处理不同类型的输入
            if isinstance(image_input, str):
                if image_input.startswith('data:image'):
                    # Base64编码的图片
                    image_data = base64.b64decode(image_input.split(',')[1])
                    image = Image.open(io.BytesIO(image_data))
                    img_array = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
                else:
                    # 文件路径
                    img_array = cv2.imread(image_input)
            elif isinstance(image_input, np.ndarray):
                img_array = image_input
            else:
                raise ValueError("不支持的图片格式")

            if img_array is None:
                raise ValueError("无法读取图片")

            # YOLOv8推理
            results = self.model(img_array, conf=0.5)

            # 解析结果
            detections = []
            meter_value = None
            max_conf = 0

            for result in results:
                boxes = result.boxes
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    conf = float(box.conf[0])
                    cls = int(box.cls[0])
                    class_name = self.model.names[cls]

                    detection = {
                        'bbox': [float(x1), float(y1), float(x2), float(y2)],
                        'confidence': round(conf, 3),
                        'class': class_name,
                        'class_id': cls
                    }
                    detections.append(detection)

                    # 假设模型能识别数字或表计读数
                    if conf > max_conf:
                        max_conf = conf
                        # 这里需要根据你的模型输出调整
                        # 如果模型直接输出数字，使用class_name转换
                        try:
                            meter_value = float(class_name)
                        except:
                            meter_value = None

            # 绘制检测框（用于返回可视化结果）
            vis_image = self._draw_detections(img_array.copy(), detections)

            # 转换为base64
            _, buffer = cv2.imencode('.jpg', vis_image)
            vis_base64 = base64.b64encode(buffer).decode('utf-8')

            return {
                'success': True,
                'meter_value': meter_value,
                'confidence': round(max_conf, 3),
                'detections': detections,
                'visualization': f'data:image/jpeg;base64,{vis_base64}',
                'timestamp': self._get_timestamp()
            }

        except Exception as e:
            logger.error("检测错误: {e}")
            return {
                'success': False,
                'error': str(e),
                'meter_value': None,
                'confidence': 0
            }

    def _draw_detections(self, image, detections):
        """绘制检测框"""
        for det in detections:
            x1, y1, x2, y2 = map(int, det['bbox'])
            conf = det['confidence']
            cls_name = det['class']

            # 根据置信度选择颜色
            color = (0, 255, 0) if conf > 0.8 else (0, 165, 255) if conf > 0.5 else (0, 0, 255)

            # 绘制框
            cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)

            # 绘制标签
            label = f'{cls_name}: {conf:.2f}'
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
            cv2.rectangle(image, (x1, y1-th-10), (x1+tw, y1), color, -1)
            cv2.putText(image, label, (x1, y1-5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

        return image

    def _get_timestamp(self):
        from datetime import datetime
        return datetime.now().isoformat()

    def process_rtsp_frame(self, rtsp_url):
        """
        处理RTSP视频流的一帧
        :param rtsp_url: RTSP地址
        :return: 检测结果
        """
        cap = cv2.VideoCapture(rtsp_url)
        if not cap.isOpened():
            return {'success': False, 'error': '无法打开视频流'}

        ret, frame = cap.read()
        cap.release()

        if not ret:
            return {'success': False, 'error': '无法读取视频帧'}

        return self.detect(frame)


# 单例模式
_detector = None

def get_detector():
    global _detector
    if _detector is None:
        _detector = MeterDetector()
    return _detector